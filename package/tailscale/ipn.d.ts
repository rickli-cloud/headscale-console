export {};

/** Generated types. Might not be 100% correct */
export namespace Ipn {
  // Profile
  export interface Profile {
    ControlURL: string;
    RouteAll: boolean;
    ExitNodeID: string;
    ExitNodeIP: string;
    InternalExitNodePrior: string;
    ExitNodeAllowLANAccess: boolean;
    CorpDNS: boolean;
    RunSSH: boolean;
    RunWebClient: boolean;
    WantRunning: boolean;
    LoggedOut: boolean;
    ShieldsUp: boolean;
    AdvertiseTags: any;
    Hostname: string;
    NotepadURLs: boolean;
    AdvertiseRoutes: any;
    AdvertiseServices: any;
    NoSNAT: boolean;
    NoStatefulFiltering: boolean;
    NetfilterMode: number;
    AutoUpdate: AutoUpdate;
    AppConnector: AppConnector;
    PostureChecking: boolean;
    NetfilterKind: string;
    DriveShares: any;
    AllowSingleHosts: boolean;
    Config: Config;
  }

  export interface AutoUpdate {
    Check: boolean;
    Apply: any;
  }

  export interface AppConnector {
    Advertise: boolean;
  }

  export interface Config {
    PrivateNodeKey: string;
    OldPrivateNodeKey: string;
    UserProfile: UserProfile;
    NetworkLockKey: string;
    NodeID: string;
  }

  export interface UserProfile {
    ID: number;
    LoginName: string;
    DisplayName: string;
  }

  export interface Profiles {
    [id: string]: {
      ID: string;
      Name: string;
      NetworkProfile: {
        MagicDNSName: string;
        DomainName: string;
      };
      Key: string;
      UserProfile: {
        ID: number;
        LoginName: string;
        DisplayName: string;
      };
      NodeID: string;
      LocalUserID: string;
      ControlURL: string;
    };
  }
}
