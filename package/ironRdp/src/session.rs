// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/crates/ironrdp-web/src/session.rs
// Changes made:
// - Replaced everything related to RDPCleanPath (websocket relay) with a custom RTCDataChannel
// - Almost completely modified connect function (see below for a better description)

// https://github.com/rustwasm/wasm-bindgen/issues/4080
#![allow(non_snake_case)]

use core::cell::RefCell;
use core::num::NonZeroU32;
use std::borrow::Cow;
use std::net::SocketAddr;
use std::rc::Rc;
use std::sync::Arc;

use anyhow::Context as _;
use base64::Engine as _;
use futures_channel::mpsc;
use futures_rustls::{client::TlsStream, pki_types::ServerName, TlsConnector};
use futures_util::io::{ReadHalf, WriteHalf};
use futures_util::{select, AsyncWriteExt as _, FutureExt as _, StreamExt as _};
use ironrdp::cliprdr::backend::ClipboardMessage;
use ironrdp::cliprdr::CliprdrClient;
use ironrdp::connector::connection_activation::ConnectionActivationState;
use ironrdp::connector::credssp::KerberosConfig;
use ironrdp::connector::{self, ClientConnector, Credentials};
use ironrdp::displaycontrol::client::DisplayControlClient;
use ironrdp::dvc::DrdynvcClient;
use ironrdp::graphics::image_processing::PixelFormat;
use ironrdp::pdu::input::fast_path::FastPathInputEvent;
use ironrdp::pdu::rdp::client_info::PerformanceFlags;
use ironrdp::session::image::DecodedImage;
use ironrdp::session::{fast_path, ActiveStage, ActiveStageOutput, GracefulDisconnectReason};
use ironrdp_core::WriteBuf;
use ironrdp_futures::single_sequence_step_read;
use rgb::AsPixels as _;
use serde::{Deserialize, Serialize};
use tap::prelude::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use web_sys::{HtmlCanvasElement, RtcDataChannel};

use crate::canvas::Canvas;
use crate::clipboard::{
    ClipboardTransaction, WasmClipboard, WasmClipboardBackend, WasmClipboardBackendMessage,
};
use crate::data_channel::DataChannelConnection;
use crate::error::IronError;
use crate::image::extract_partial_image;
use crate::input::InputTransaction;
use crate::network_client::WasmNetworkClient;
use crate::{clipboard, DesktopSize};

const DEFAULT_WIDTH: u16 = 1280;
const DEFAULT_HEIGHT: u16 = 720;

#[wasm_bindgen]
#[derive(Clone, Default)]
pub struct SessionBuilder(Rc<RefCell<SessionBuilderInner>>);

struct SessionBuilderInner {
    data_channel: Option<RtcDataChannel>,
    username: Option<String>,
    destination: Option<String>,
    server_domain: Option<String>,
    password: Option<String>,
    kdc_proxy_url: Option<String>,
    client_name: String,
    desktop_size: DesktopSize,

    render_canvas: Option<HtmlCanvasElement>,
    set_cursor_style_callback: Option<js_sys::Function>,
    set_cursor_style_callback_context: Option<JsValue>,
    remote_clipboard_changed_callback: Option<js_sys::Function>,
    remote_received_format_list_callback: Option<js_sys::Function>,
    force_clipboard_update_callback: Option<js_sys::Function>,

    use_display_control: bool,
}

impl Default for SessionBuilderInner {
    fn default() -> Self {
        Self {
            data_channel: None,
            username: None,
            destination: None,
            server_domain: None,
            password: None,
            kdc_proxy_url: None,
            client_name: "ironrdp-web".to_owned(),
            desktop_size: DesktopSize {
                width: DEFAULT_WIDTH,
                height: DEFAULT_HEIGHT,
            },

            render_canvas: None,
            set_cursor_style_callback: None,
            set_cursor_style_callback_context: None,
            remote_clipboard_changed_callback: None,
            remote_received_format_list_callback: None,
            force_clipboard_update_callback: None,

            use_display_control: true,
        }
    }
}

#[wasm_bindgen]
impl SessionBuilder {
    pub fn init() -> SessionBuilder {
        Self(Rc::new(RefCell::new(SessionBuilderInner::default())))
    }

    /// Required
    pub fn data_channel(&self, channel: RtcDataChannel) -> SessionBuilder {
        self.0.borrow_mut().data_channel = Some(channel);
        self.clone()
    }

    /// Required
    pub fn username(&self, username: String) -> SessionBuilder {
        self.0.borrow_mut().username = Some(username);
        self.clone()
    }

    /// Required
    pub fn destination(&self, destination: String) -> SessionBuilder {
        self.0.borrow_mut().destination = Some(destination);
        self.clone()
    }

    /// Optional
    pub fn server_domain(&self, server_domain: String) -> SessionBuilder {
        self.0.borrow_mut().server_domain = if server_domain.is_empty() {
            None
        } else {
            Some(server_domain)
        };
        self.clone()
    }

    /// Required
    pub fn password(&self, password: String) -> SessionBuilder {
        self.0.borrow_mut().password = Some(password);
        self.clone()
    }

    /// Optional
    pub fn desktop_size(&self, desktop_size: DesktopSize) -> SessionBuilder {
        self.0.borrow_mut().desktop_size = desktop_size;
        self.clone()
    }

    /// Optional
    pub fn render_canvas(&self, canvas: HtmlCanvasElement) -> SessionBuilder {
        self.0.borrow_mut().render_canvas = Some(canvas);
        self.clone()
    }

    /// Required.
    ///
    /// # Callback signature:
    /// ```typescript
    /// function callback(
    ///     cursor_kind: string,
    ///     cursor_data: string | undefined,
    ///     hotspot_x: number | undefined,
    ///     hotspot_y: number | undefined
    /// ): void
    /// ```
    ///
    /// # Cursor kinds:
    /// - `default` (default system cursor); other arguments are `UNDEFINED`
    /// - `none` (hide cursor); other arguments are `UNDEFINED`
    /// - `url` (custom cursor data URL); `cursor_data` contains the data URL with Base64-encoded
    ///   cursor bitmap; `hotspot_x` and `hotspot_y` are set to the cursor hotspot coordinates.
    pub fn set_cursor_style_callback(&self, callback: js_sys::Function) -> SessionBuilder {
        self.0.borrow_mut().set_cursor_style_callback = Some(callback);
        self.clone()
    }

    /// Required.
    pub fn set_cursor_style_callback_context(&self, context: JsValue) -> SessionBuilder {
        self.0.borrow_mut().set_cursor_style_callback_context = Some(context);
        self.clone()
    }

    /// Optional
    pub fn remote_clipboard_changed_callback(&self, callback: js_sys::Function) -> SessionBuilder {
        self.0.borrow_mut().remote_clipboard_changed_callback = Some(callback);
        self.clone()
    }

    /// Optional
    pub fn remote_received_format_list_callback(
        &self,
        callback: js_sys::Function,
    ) -> SessionBuilder {
        self.0.borrow_mut().remote_received_format_list_callback = Some(callback);
        self.clone()
    }

    /// Optional
    pub fn force_clipboard_update_callback(&self, callback: js_sys::Function) -> SessionBuilder {
        self.0.borrow_mut().force_clipboard_update_callback = Some(callback);
        self.clone()
    }

    pub fn extension(&self, value: JsValue) -> SessionBuilder {
        match serde_wasm_bindgen::from_value::<Extension>(value) {
            Ok(value) => match value {
                Extension::KdcProxyUrl(kdc_proxy_url) => {
                    self.0.borrow_mut().kdc_proxy_url = Some(kdc_proxy_url)
                }
                Extension::DisplayControl(use_display_control) => {
                    self.0.borrow_mut().use_display_control = use_display_control
                }
            },
            Err(error) => error!(%error, "Unsupported extension value"),
        }

        self.clone()
    }

    pub async fn connect(&self) -> Result<Session, IronError> {
        let (
            data_channel,
            username,
            destination,
            server_domain,
            password,
            kdc_proxy_url,
            client_name,
            desktop_size,
            render_canvas,
            set_cursor_style_callback,
            set_cursor_style_callback_context,
            remote_clipboard_changed_callback,
            remote_received_format_list_callback,
            force_clipboard_update_callback,
        );

        {
            let inner = self.0.borrow();

            data_channel = inner.data_channel.clone().context("data_channel missing")?;
            username = inner.username.clone().context("username missing")?;
            destination = inner.destination.clone().context("destination missing")?;
            server_domain = inner.server_domain.clone();
            password = inner.password.clone().context("password missing")?;
            kdc_proxy_url = inner.kdc_proxy_url.clone();
            client_name = inner.client_name.clone();
            desktop_size = inner.desktop_size.clone();

            render_canvas = inner
                .render_canvas
                .clone()
                .context("render_canvas missing")?;

            set_cursor_style_callback = inner
                .set_cursor_style_callback
                .clone()
                .context("set_cursor_style_callback missing")?;
            set_cursor_style_callback_context = inner
                .set_cursor_style_callback_context
                .clone()
                .context("set_cursor_style_callback_context missing")?;
            remote_clipboard_changed_callback = inner.remote_clipboard_changed_callback.clone();
            remote_received_format_list_callback =
                inner.remote_received_format_list_callback.clone();
            force_clipboard_update_callback = inner.force_clipboard_update_callback.clone();
        }

        info!("Connect to RDP host");

        let config = build_config(username, password, server_domain, client_name, desktop_size);

        let (input_events_tx, input_events_rx) = mpsc::unbounded();

        let clipboard = remote_clipboard_changed_callback.clone().map(|callback| {
            WasmClipboard::new(
                clipboard::WasmClipboardMessageProxy::new(input_events_tx.clone()),
                clipboard::JsClipboardCallbacks {
                    on_remote_clipboard_changed: callback,
                    on_remote_received_format_list: remote_received_format_list_callback,
                    on_force_clipboard_update: force_clipboard_update_callback,
                },
            )
        });

        let data_connection = DataChannelConnection::new(data_channel);

        let use_display_control = self.0.borrow().use_display_control;

        let (connection_result, upgraded_framed) = connect(ConnectParams {
            data_connection,
            config,
            destination,
            kdc_proxy_url,
            clipboard_backend: clipboard.as_ref().map(|clip| clip.backend()),
            use_display_control,
        })
        .await?;

        info!("Connected!");

        let data_connection = upgraded_framed.into_inner_no_leftover();

        let (rdp_reader, rdp_writer) = futures_util::AsyncReadExt::split(data_connection);

        let (writer_tx, writer_rx) = mpsc::unbounded();

        spawn_local(writer_task(writer_rx, rdp_writer));

        Ok(Session {
            desktop_size: connection_result.desktop_size,
            input_database: RefCell::new(ironrdp::input::Database::new()),
            writer_tx,
            input_events_tx,

            render_canvas,
            set_cursor_style_callback,
            set_cursor_style_callback_context,

            input_events_rx: RefCell::new(Some(input_events_rx)),
            rdp_reader: RefCell::new(Some(rdp_reader)),
            connection_result: RefCell::new(Some(connection_result)),
            clipboard: RefCell::new(Some(clipboard)),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
enum Extension {
    KdcProxyUrl(String),
    DisplayControl(bool),
}

pub(crate) type FastPathInputEvents = smallvec::SmallVec<[FastPathInputEvent; 2]>;

#[derive(Debug)]
pub(crate) enum RdpInputEvent {
    Cliprdr(ClipboardMessage),
    ClipboardBackend(WasmClipboardBackendMessage),
    FastPath(FastPathInputEvents),
    Resize {
        width: u32,
        height: u32,
        scale_factor: Option<u32>,
        physical_size: Option<(u32, u32)>,
    },
    TerminateSession,
}

enum CursorStyle {
    Default,
    Hidden,
    Url {
        data: String,
        hotspot_x: u16,
        hotspot_y: u16,
    },
}

#[wasm_bindgen]
pub struct SessionTerminationInfo {
    reason: GracefulDisconnectReason,
}

#[wasm_bindgen]
impl SessionTerminationInfo {
    pub fn reason(&self) -> String {
        self.reason.to_string()
    }
}

#[wasm_bindgen]
pub struct Session {
    desktop_size: connector::DesktopSize,
    input_database: RefCell<ironrdp::input::Database>,
    writer_tx: mpsc::UnboundedSender<Vec<u8>>,
    input_events_tx: mpsc::UnboundedSender<RdpInputEvent>,

    render_canvas: HtmlCanvasElement,
    set_cursor_style_callback: js_sys::Function,
    set_cursor_style_callback_context: JsValue,

    // Consumed when `run` is called
    input_events_rx: RefCell<Option<mpsc::UnboundedReceiver<RdpInputEvent>>>,
    connection_result: RefCell<Option<connector::ConnectionResult>>,
    rdp_reader: RefCell<Option<ReadHalf<TlsStream<DataChannelConnection>>>>,
    clipboard: RefCell<Option<Option<WasmClipboard>>>,
}

#[wasm_bindgen]
impl Session {
    pub async fn run(&self) -> Result<SessionTerminationInfo, IronError> {
        let rdp_reader = self
            .rdp_reader
            .borrow_mut()
            .take()
            .context("RDP session can be started only once")?;

        let mut input_events = self
            .input_events_rx
            .borrow_mut()
            .take()
            .context("RDP session can be started only once")?;

        let connection_result = self
            .connection_result
            .borrow_mut()
            .take()
            .expect("run called only once");

        let mut clipboard = self
            .clipboard
            .borrow_mut()
            .take()
            .expect("run called only once");

        let mut framed = ironrdp_futures::LocalFuturesFramed::new(rdp_reader);

        debug!("Initialize canvas");

        let mut gui = Canvas::new(
            self.render_canvas.clone(),
            u32::from(connection_result.desktop_size.width),
            u32::from(connection_result.desktop_size.height),
        )
        .context("canvas initialization")?;

        debug!("Canvas initialized");

        info!("Start RDP session");

        let mut image = DecodedImage::new(
            PixelFormat::RgbA32,
            connection_result.desktop_size.width,
            connection_result.desktop_size.height,
        );

        let mut active_stage = ActiveStage::new(connection_result);

        let disconnect_reason = 'outer: loop {
            let outputs = select! {
                frame = framed.read_pdu().fuse() => {
                    let (action, payload) = frame.context("read frame")?;
                    trace!(?action, frame_length = payload.len(), "Frame received");

                    active_stage.process(&mut image, action, &payload)?
                }
                input_events = input_events.next() => {
                    let event = input_events.context("read next input events")?;

                    match event {
                        RdpInputEvent::Cliprdr(message) => {
                            if let Some(cliprdr) = active_stage.get_svc_processor::<CliprdrClient>() {
                                if let Some(svc_messages) = match message {
                                    ClipboardMessage::SendInitiateCopy(formats) => Some(
                                        cliprdr.initiate_copy(&formats)
                                            .context("CLIPRDR initiate copy")?
                                    ),
                                    ClipboardMessage::SendFormatData(response) => Some(
                                        cliprdr.submit_format_data(response)
                                            .context("CLIPRDR submit format data")?
                                    ),
                                    ClipboardMessage::SendInitiatePaste(format) => Some(
                                        cliprdr.initiate_paste(format)
                                            .context("CLIPRDR initiate paste")?
                                    ),
                                    ClipboardMessage::Error(e) => {
                                        error!("Clipboard backend error: {}", e);
                                        None
                                    }
                                } {
                                    let frame = active_stage.process_svc_processor_messages(svc_messages)?;
                                    // Send the messages to the server
                                    vec![ActiveStageOutput::ResponseFrame(frame)]
                                } else {
                                    // No messages to send to the server
                                    Vec::new()
                                }
                            } else  {
                                warn!("Clipboard event received, but Cliprdr is not available");
                                Vec::new()
                            }
                        }
                        RdpInputEvent::ClipboardBackend(event) => {
                            if let Some(clipboard) = &mut clipboard {
                                clipboard.process_event(event)?;
                            }
                            // No RDP output frames for backend event processing
                            Vec::new()
                        }
                        RdpInputEvent::FastPath(events) => {
                            active_stage.process_fastpath_input(&mut image, &events)
                                .context("fast path input events processing")?
                        }
                        RdpInputEvent::Resize { width, height, scale_factor, physical_size } => {
                            debug!(width, height, scale_factor, "Resize event received");
                            if width == 0 || height == 0 {
                                warn!("Resize event ignored: width or height is zero");
                                Vec::new()
                            } else if let Some(response_frame) = active_stage.encode_resize(width, height, scale_factor, physical_size) {
                                self.render_canvas.set_width(width);
                                self.render_canvas.set_height(height);
                                gui.resize(NonZeroU32::new(width).unwrap(), NonZeroU32::new(height).unwrap());
                                vec![ActiveStageOutput::ResponseFrame(response_frame?)]
                            } else {
                                debug!("Resize event ignored");
                                Vec::new()
                            }
                        },
                        RdpInputEvent::TerminateSession => {
                            active_stage.graceful_shutdown()
                                .context("graceful shutdown")?
                        }
                    }
                }
            };

            for out in outputs {
                match out {
                    ActiveStageOutput::ResponseFrame(frame) => {
                        self.writer_tx
                            .unbounded_send(frame)
                            .context("Send frame to writer task")?;
                    }
                    ActiveStageOutput::GraphicsUpdate(region) => {
                        // PERF: some copies and conversion could be optimized
                        let (region, buffer) = extract_partial_image(&image, region);
                        gui.draw(&buffer, region).context("draw updated region")?;
                    }
                    ActiveStageOutput::PointerDefault => {
                        self.set_cursor_style(CursorStyle::Default)?;
                    }
                    ActiveStageOutput::PointerHidden => {
                        self.set_cursor_style(CursorStyle::Hidden)?;
                    }
                    ActiveStageOutput::PointerPosition { .. } => {
                        // Not applicable for web.
                    }
                    ActiveStageOutput::PointerBitmap(pointer) => {
                        // Maximum allowed cursor size for browsers is 32x32, because bigger sizes
                        // will cause the following issues:
                        // - cursors bigger than 128x128 are not supported in browsers.
                        // - cursors bigger than 32x32 will default to the system cursor if their
                        //   sprite does not fit in the browser's viewport, introducing an abrupt
                        //   cursor style change when the cursor is moved to the edge of the
                        //   browser window.
                        //
                        // Therefore, we need to scale the cursor sprite down to 32x32 if it is
                        // bigger than that.
                        const MAX_CURSOR_SIZE: u16 = 32;
                        // INVARIANT: 0 < scale <= 1.0
                        // INVARIANT: pointer.width * scale <= MAX_CURSOR_SIZE
                        // INVARIANT: pointer.height * scale <= MAX_CURSOR_SIZE
                        let scale =
                            if pointer.width >= pointer.height && pointer.width > MAX_CURSOR_SIZE {
                                Some(f64::from(MAX_CURSOR_SIZE) / f64::from(pointer.width))
                            } else if pointer.height > MAX_CURSOR_SIZE {
                                Some(f64::from(MAX_CURSOR_SIZE) / f64::from(pointer.height))
                            } else {
                                None
                            };

                        let (png_width, png_height, hotspot_x, hotspot_y, rgba_buffer) =
                            if let Some(scale) = scale {
                                // Per invariants: Following conversions will never saturate.
                                let scaled_width =
                                    f64_to_u16_saturating_cast(f64::from(pointer.width) * scale);
                                let scaled_height =
                                    f64_to_u16_saturating_cast(f64::from(pointer.height) * scale);
                                let hotspot_x = f64_to_u16_saturating_cast(
                                    f64::from(pointer.hotspot_x) * scale,
                                );
                                let hotspot_y = f64_to_u16_saturating_cast(
                                    f64::from(pointer.hotspot_y) * scale,
                                );

                                // Per invariants: scaled_width * scaled_height * 4 <= 32 * 32 * 4 < usize::MAX
                                #[allow(clippy::arithmetic_side_effects)]
                                let resized_rgba_buffer_size =
                                    usize::from(scaled_width * scaled_height * 4);

                                let mut rgba_resized = vec![0u8; resized_rgba_buffer_size];
                                let mut resizer = resize::new(
                                    usize::from(pointer.width),
                                    usize::from(pointer.height),
                                    usize::from(scaled_width),
                                    usize::from(scaled_height),
                                    resize::Pixel::RGBA8P,
                                    resize::Type::Lanczos3,
                                )
                                .context("failed to initialize cursor resizer")?;

                                resizer
                                    .resize(
                                        pointer.bitmap_data.as_pixels(),
                                        rgba_resized.as_pixels_mut(),
                                    )
                                    .context("failed to resize cursor")?;

                                (
                                    scaled_width,
                                    scaled_height,
                                    hotspot_x,
                                    hotspot_y,
                                    Cow::Owned(rgba_resized),
                                )
                            } else {
                                (
                                    pointer.width,
                                    pointer.height,
                                    pointer.hotspot_x,
                                    pointer.hotspot_y,
                                    Cow::Borrowed(pointer.bitmap_data.as_slice()),
                                )
                            };

                        // Encode PNG.
                        let mut png_buffer = Vec::new();
                        {
                            let mut encoder = png::Encoder::new(
                                &mut png_buffer,
                                u32::from(png_width),
                                u32::from(png_height),
                            );

                            encoder.set_color(png::ColorType::Rgba);
                            encoder.set_depth(png::BitDepth::Eight);
                            encoder.set_compression(png::Compression::Fast);
                            let mut writer = encoder
                                .write_header()
                                .context("PNG encoder header write failed")?;
                            writer
                                .write_image_data(rgba_buffer.as_ref())
                                .context("failed to encode pointer PNG")?;
                        }

                        // Encode PNG into Base64 data URL.
                        let mut style = "data:image/png;base64,".to_owned();
                        base64::engine::general_purpose::STANDARD
                            .encode_string(png_buffer, &mut style);

                        self.set_cursor_style(CursorStyle::Url {
                            data: style,
                            hotspot_x,
                            hotspot_y,
                        })?;
                    }
                    ActiveStageOutput::DeactivateAll(mut box_connection_activation) => {
                        // Execute the Deactivation-Reactivation Sequence:
                        // https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-rdpbcgr/dfc234ce-481a-4674-9a5d-2a7bafb14432
                        debug!("Received Server Deactivate All PDU, executing Deactivation-Reactivation Sequence");
                        let mut buf = WriteBuf::new();
                        'activation_seq: loop {
                            let written = single_sequence_step_read(
                                &mut framed,
                                &mut *box_connection_activation,
                                &mut buf,
                            )
                            .await?;

                            if written.size().is_some() {
                                self.writer_tx
                                    .unbounded_send(buf.filled().to_vec())
                                    .context("Send frame to writer task")?;
                            }

                            if let ConnectionActivationState::Finalized {
                                io_channel_id,
                                user_channel_id,
                                desktop_size,
                                no_server_pointer,
                                pointer_software_rendering,
                            } = box_connection_activation.state
                            {
                                debug!("Deactivation-Reactivation Sequence completed");
                                image = DecodedImage::new(
                                    PixelFormat::RgbA32,
                                    desktop_size.width,
                                    desktop_size.height,
                                );
                                // Create a new [`FastPathProcessor`] with potentially updated
                                // io/user channel ids.
                                active_stage.set_fastpath_processor(
                                    fast_path::ProcessorBuilder {
                                        io_channel_id,
                                        user_channel_id,
                                        no_server_pointer,
                                        pointer_software_rendering,
                                    }
                                    .build(),
                                );
                                active_stage.set_no_server_pointer(no_server_pointer);
                                break 'activation_seq;
                            }
                        }
                    }
                    ActiveStageOutput::Terminate(reason) => break 'outer reason,
                }
            }
        };

        info!(%disconnect_reason, "RPD session terminated");

        Ok(SessionTerminationInfo {
            reason: disconnect_reason,
        })
    }

    pub fn desktop_size(&self) -> DesktopSize {
        DesktopSize {
            width: self.desktop_size.width,
            height: self.desktop_size.height,
        }
    }

    pub fn apply_inputs(&self, transaction: InputTransaction) -> Result<(), IronError> {
        let inputs = self.input_database.borrow_mut().apply(transaction);
        self.h_send_inputs(inputs)
    }

    pub fn release_all_inputs(&self) -> Result<(), IronError> {
        let inputs = self.input_database.borrow_mut().release_all();
        self.h_send_inputs(inputs)
    }

    fn h_send_inputs(
        &self,
        inputs: smallvec::SmallVec<[FastPathInputEvent; 2]>,
    ) -> Result<(), IronError> {
        if !inputs.is_empty() {
            trace!("Inputs: {inputs:?}");

            self.input_events_tx
                .unbounded_send(RdpInputEvent::FastPath(inputs))
                .context("Send input events to writer task")?;
        }

        Ok(())
    }

    pub fn synchronize_lock_keys(
        &self,
        scroll_lock: bool,
        num_lock: bool,
        caps_lock: bool,
        kana_lock: bool,
    ) -> Result<(), IronError> {
        use ironrdp::pdu::input::fast_path::FastPathInput;

        let event = ironrdp::input::synchronize_event(scroll_lock, num_lock, caps_lock, kana_lock);
        let fastpath_input = FastPathInput(vec![event]);

        let frame = ironrdp::core::encode_vec(&fastpath_input).context("FastPathInput encoding")?;

        self.writer_tx
            .unbounded_send(frame)
            .context("Send frame to writer task")?;

        Ok(())
    }

    pub fn shutdown(&self) -> Result<(), IronError> {
        self.input_events_tx
            .unbounded_send(RdpInputEvent::TerminateSession)
            .context("failed to send terminate session event to writer task")?;

        Ok(())
    }

    pub async fn on_clipboard_paste(&self, content: ClipboardTransaction) -> Result<(), IronError> {
        self.input_events_tx
            .unbounded_send(RdpInputEvent::ClipboardBackend(
                WasmClipboardBackendMessage::LocalClipboardChanged(content),
            ))
            .context("Send clipboard backend event")?;

        Ok(())
    }

    fn set_cursor_style(&self, style: CursorStyle) -> Result<(), IronError> {
        let (kind, data, hotspot_x, hotspot_y) = match style {
            CursorStyle::Default => ("default", None, None, None),
            CursorStyle::Hidden => ("hidden", None, None, None),
            CursorStyle::Url {
                data,
                hotspot_x,
                hotspot_y,
            } => ("url", Some(data), Some(hotspot_x), Some(hotspot_y)),
        };

        let args = js_sys::Array::from_iter([
            JsValue::from_str(kind),
            JsValue::from(data),
            JsValue::from_f64(hotspot_x.unwrap_or_default().into()),
            JsValue::from_f64(hotspot_y.unwrap_or_default().into()),
        ]);

        let _ret = self
            .set_cursor_style_callback
            .apply(&self.set_cursor_style_callback_context, &args)
            .map_err(|e| anyhow::Error::msg(format!("set cursor style callback failed: {e:?}")))?;

        Ok(())
    }

    pub fn resize(
        &self,
        width: u32,
        height: u32,
        scale_factor: Option<u32>,
        physical_width: Option<u32>,
        physical_height: Option<u32>,
    ) {
        self.input_events_tx
            .unbounded_send(RdpInputEvent::Resize {
                width,
                height,
                scale_factor,
                physical_size: physical_width
                    .and_then(|width| physical_height.map(|height| (width, height))),
            })
            .expect("send resize event to writer task");
    }

    #[allow(clippy::unused_self)]
    pub fn supports_unicode_keyboard_shortcuts(&self) -> bool {
        // RDP does not support Unicode keyboard shortcuts (When key combinations are executed, only
        // plain scancode events are allowed to function correctly).
        false
    }

    pub fn extension_call(_value: JsValue) -> Result<JsValue, IronError> {
        Ok(JsValue::null())
    }
}

fn build_config(
    username: String,
    password: String,
    domain: Option<String>,
    client_name: String,
    desktop_size: DesktopSize,
) -> connector::Config {
    connector::Config {
        credentials: Credentials::UsernamePassword { username, password },
        domain,
        // TODO(#327): expose these options from the WASM module.
        enable_tls: true,
        enable_credssp: true,
        keyboard_type: ironrdp::pdu::gcc::KeyboardType::IbmEnhanced,
        keyboard_subtype: 0,
        keyboard_layout: 0, // the server SHOULD use the default active input locale identifier
        keyboard_functional_keys_count: 12,
        ime_file_name: String::new(),
        dig_product_id: String::new(),
        desktop_size: connector::DesktopSize {
            width: desktop_size.width,
            height: desktop_size.height,
        },
        bitmap: Some(connector::BitmapConfig {
            color_depth: 16,
            lossy_compression: true,
        }),
        #[allow(clippy::arithmetic_side_effects)] // fine unless we end up with an insanely big version
        client_build: semver::Version::parse(env!("CARGO_PKG_VERSION"))
            .map(|version| version.major * 100 + version.minor * 10 + version.patch)
            .unwrap_or(0)
            .pipe(u32::try_from)
            .unwrap(),
        client_name,
        // NOTE: hardcode this value like in freerdp
        // https://github.com/FreeRDP/FreeRDP/blob/4e24b966c86fdf494a782f0dfcfc43a057a2ea60/libfreerdp/core/settings.c#LL49C34-L49C70
        client_dir: "C:\\Windows\\System32\\mstscax.dll".to_owned(),
        platform: ironrdp::pdu::rdp::capability_sets::MajorPlatformType::UNSPECIFIED,
        no_server_pointer: false,
        autologon: false,
        // no_audio_playback: true,
        request_data: None,
        pointer_software_rendering: false,
        performance_flags: PerformanceFlags::default(),
        desktop_scale_factor: 0,
        hardware_id: None,
        license_cache: None,
    }
}

async fn writer_task(
    rx: mpsc::UnboundedReceiver<Vec<u8>>,
    rdp_writer: WriteHalf<TlsStream<DataChannelConnection>>,
) {
    debug!("writer task started");

    async fn inner(
        mut rx: mpsc::UnboundedReceiver<Vec<u8>>,
        mut rdp_writer: WriteHalf<TlsStream<DataChannelConnection>>,
    ) -> anyhow::Result<()> {
        while let Some(frame) = rx.next().await {
            rdp_writer
                .write_all(&frame)
                .await
                .context("Couldn’t write frame")?;
            rdp_writer.flush().await.context("Couldn’t flush")?;
        }

        Ok(())
    }

    match inner(rx, rdp_writer).await {
        Ok(()) => debug!("writer task ended gracefully"),
        Err(e) => error!("writer task ended unexpectedly: {e:#}"),
    }
}

#[allow(clippy::cast_sign_loss)]
#[allow(clippy::cast_possible_truncation)]
fn f64_to_u16_saturating_cast(value: f64) -> u16 {
    value as u16
}

// Everything below is a almost completely custom connect method
// The websocket connection was fully replaced with a custom RTCDataChannel
// and different framing to enable bidirectional communication with JavaScript.
// TLS was added as well as the RDCleanPath implementation (the "protocol" used inside the websocket)
// relied on the already existing encryption (wss, normal RDP TLS from relay to server).

type UpgradedFramed = ironrdp_futures::FuturesFramed<TlsStream<DataChannelConnection>>;

struct ConnectParams {
    data_connection: DataChannelConnection,
    config: connector::Config,
    destination: String,
    kdc_proxy_url: Option<String>,
    clipboard_backend: Option<WasmClipboardBackend>,
    use_display_control: bool,
}

async fn connect(
    ConnectParams {
        data_connection,
        config,
        destination,
        kdc_proxy_url,
        clipboard_backend,
        use_display_control,
    }: ConnectParams,
) -> Result<(connector::ConnectionResult, UpgradedFramed), IronError> {
    let addr: SocketAddr = destination
        .parse()
        .expect("Destionation is not a socket address");

    let mut framed = ironrdp_futures::FuturesFramed::new(data_connection);

    let mut connector = ClientConnector::new(config).with_server_addr(addr);

    let server_name = ServerName::try_from(addr.ip().to_owned()).expect("Invalid server name");

    if let Some(clipboard_backend) = clipboard_backend {
        connector.attach_static_channel(CliprdrClient::new(Box::new(clipboard_backend)));
    }

    if use_display_control {
        connector.attach_static_channel(
            DrdynvcClient::new()
                .with_dynamic_channel(DisplayControlClient::new(|_| Ok(Vec::new()))),
        );
    }

    info!("Begin RDP connection procedure");

    let should_upgrade = ironrdp_futures::connect_begin(&mut framed, &mut connector).await?;

    debug!("TLS upgrade");

    let mut config = rustls::client::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(std::sync::Arc::new(danger::NoCertificateVerification))
        .with_no_client_auth();

    // Disable TLS resumption because it’s not supported by some services such as CredSSP.
    // > The CredSSP Protocol does not extend the TLS wire protocol. TLS session resumption is not supported.
    // source: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-cssp/385a7489-d46b-464c-b224-f7340e308a5c
    config.resumption = rustls::client::Resumption::disabled();

    let conn = TlsConnector::from(Arc::new(config));

    let initial_stream = framed.into_inner_no_leftover();

    let upgraded_stream = conn
        .connect(server_name, initial_stream)
        .await
        .expect("TLS connect failed");

    let server_public_key = {
        let cert = upgraded_stream
            .get_ref()
            .1
            .peer_certificates()
            .and_then(|certificates| certificates.first())
            .expect("peer certificate is missing");
        extract_tls_server_public_key(cert).expect("peer certificate parsing error")
    };

    debug!("TLS upgrade completed");

    let upgraded = ironrdp_futures::mark_as_upgraded(should_upgrade, &mut connector);

    let mut upgraded_framed = ironrdp_futures::FuturesFramed::new(upgraded_stream);

    info!("Initial RDP connection procedure complete");

    let connection_result = ironrdp_futures::connect_finalize(
        upgraded,
        &mut upgraded_framed,
        connector,
        (&destination).into(),
        server_public_key,
        Some(&mut WasmNetworkClient),
        url::Url::parse(kdc_proxy_url.unwrap_or_default().as_str())
            .ok()
            .map(|url| KerberosConfig {
                kdc_proxy_url: Some(url),
                hostname: Some(destination),
            }),
    )
    .await?;

    Ok((connection_result, upgraded_framed))
}

mod danger {
    use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
    use rustls::{pki_types, DigitallySignedStruct, Error, SignatureScheme};

    #[derive(Debug)]
    pub(super) struct NoCertificateVerification;

    impl ServerCertVerifier for NoCertificateVerification {
        fn verify_server_cert(
            &self,
            _: &pki_types::CertificateDer<'_>,
            _: &[pki_types::CertificateDer<'_>],
            _: &pki_types::ServerName<'_>,
            _: &[u8],
            _: pki_types::UnixTime,
        ) -> Result<ServerCertVerified, Error> {
            Ok(ServerCertVerified::assertion())
        }

        fn verify_tls12_signature(
            &self,
            _: &[u8],
            _: &pki_types::CertificateDer<'_>,
            _: &DigitallySignedStruct,
        ) -> Result<HandshakeSignatureValid, Error> {
            Ok(HandshakeSignatureValid::assertion())
        }

        fn verify_tls13_signature(
            &self,
            _: &[u8],
            _: &pki_types::CertificateDer<'_>,
            _: &DigitallySignedStruct,
        ) -> Result<HandshakeSignatureValid, Error> {
            Ok(HandshakeSignatureValid::assertion())
        }

        fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
            vec![
                SignatureScheme::RSA_PKCS1_SHA1,
                SignatureScheme::ECDSA_SHA1_Legacy,
                SignatureScheme::RSA_PKCS1_SHA256,
                SignatureScheme::ECDSA_NISTP256_SHA256,
                SignatureScheme::RSA_PKCS1_SHA384,
                SignatureScheme::ECDSA_NISTP384_SHA384,
                SignatureScheme::RSA_PKCS1_SHA512,
                SignatureScheme::ECDSA_NISTP521_SHA512,
                SignatureScheme::RSA_PSS_SHA256,
                SignatureScheme::RSA_PSS_SHA384,
                SignatureScheme::RSA_PSS_SHA512,
                SignatureScheme::ED25519,
                SignatureScheme::ED448,
            ]
        }
    }
}

fn extract_tls_server_public_key(cert: &[u8]) -> std::io::Result<Vec<u8>> {
    use std::io;

    use x509_cert::der::Decode as _;

    let cert = x509_cert::Certificate::from_der(cert).map_err(io::Error::other)?;

    let server_public_key = cert
        .tbs_certificate
        .subject_public_key_info
        .subject_public_key
        .as_bytes()
        .ok_or_else(|| io::Error::other("subject public key BIT STRING is not aligned"))?
        .to_owned();

    Ok(server_public_key)
}
