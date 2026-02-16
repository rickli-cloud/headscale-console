// Custom bridge between JS and Rust using a RTCDataChannel

use core::pin::Pin;
use core::task::{Context, Poll};
use futures_util::task::AtomicWaker;
use futures_util::{AsyncRead, AsyncWrite};
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{MessageEvent, RtcDataChannel};

/// A WASM‑friendly framed connection for an RTCDataChannel.
///
/// This type wraps an RtcDataChannel and implements AsyncRead and AsyncWrite
/// by using an internal byte buffer (with Rc/RefCell) and a waker to signal incoming data.
pub struct DataChannelConnection {
    channel: RtcDataChannel,
    /// A flat byte buffer that accumulates incoming binary data.
    buffer: Rc<RefCell<Vec<u8>>>,
    /// A waker to notify pending tasks when new data has arrived.
    waker: Arc<AtomicWaker>,
    /// Keep the message callback alive.
    _onmessage_closure: Closure<dyn FnMut(MessageEvent)>,
}

impl DataChannelConnection {
    /// Creates a new DataChannelConnection wrapping the provided RTCDataChannel.
    pub fn new(channel: RtcDataChannel) -> Self {
        let label = channel.label();
        let buffer = Rc::new(RefCell::new(Vec::new()));
        let waker = Arc::new(AtomicWaker::new());
        let waker_clone = Arc::clone(&waker);
        let buffer_clone = Rc::clone(&buffer);

        // Define the callback that receives incoming messages.
        let onmessage_closure = Closure::wrap(Box::new(move |event: MessageEvent| {
            if let Ok(view) = event.data().dyn_into::<Uint8Array>() {
                let len = view.length() as usize;
                let mut buf = buffer_clone.borrow_mut();
                let start = buf.len();
                buf.resize(start + len, 0);
                view.copy_to(&mut buf[start..]);
                // Log the number of bytes received.
                trace!("Received and buffered {} bytes", len);
                // Wake any pending reader.
                waker_clone.wake();
            } else {
                warn!("Received non-Uint8Array message on RTC data channel");
            }
        }) as Box<dyn FnMut(MessageEvent)>);

        channel.set_onmessage(Some(onmessage_closure.as_ref().unchecked_ref()));
        info!("DataChannelConnection created for channel: {}", label);

        Self {
            channel,
            buffer,
            waker,
            _onmessage_closure: onmessage_closure,
        }
    }
}

impl AsyncRead for DataChannelConnection {
    /// Attempts to read data from the internal buffer.
    /// Registers the current task's waker and returns Pending if no data is available.
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        out_buf: &mut [u8],
    ) -> Poll<std::io::Result<usize>> {
        // Register the waker for when new data arrives.
        self.waker.register(cx.waker());

        let mut internal = self.buffer.borrow_mut();
        if internal.is_empty() {
            return Poll::Pending;
        }

        let n = std::cmp::min(out_buf.len(), internal.len());
        out_buf[..n].copy_from_slice(&internal[..n]);
        internal.drain(..n);
        trace!("Delivered {} bytes from buffer", n);
        Poll::Ready(Ok(n))
    }
}

impl AsyncWrite for DataChannelConnection {
    /// Converts the input bytes to a Uint8Array and sends them over the RTCDataChannel.
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        in_buf: &[u8],
    ) -> Poll<std::io::Result<usize>> {
        trace!(in_buf, "poll_write");

        let array = Uint8Array::from(in_buf);
        match self.get_mut().channel.send_with_u8_array(&array.to_vec()) {
            Ok(_) => {
                trace!("Sent {} bytes over RTC channel", in_buf.len());
                Poll::Ready(Ok(in_buf.len()))
            }
            Err(e) => {
                warn!("Failed to send data over RTC: {:?}", e);
                Poll::Ready(Err(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Send failed: {:?}", e),
                )))
            }
        }
    }

    /// No-op flush for RTCDataChannel.
    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        trace!("Flush called on RTC channel (noop)");
        Poll::Ready(Ok(()))
    }

    /// Closes the RTCDataChannel.
    fn poll_close(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        self.get_mut().channel.close();
        info!("RTC channel closed");
        Poll::Ready(Ok(()))
    }
}

// Because the RTCDataChannel and our buffering are only used from a single thread (WASM),
// we can provide an unsafe impl for Sync & Send.
unsafe impl Sync for DataChannelConnection {}
unsafe impl Send for DataChannelConnection {}
