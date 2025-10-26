import type { JSONSchema4 } from "json-schema";

/** Reoccurring regexes */
const regexes = {
  group: "^group:[A-Za-z0-9._-]+$",
  tag: "^tag:[A-Za-z0-9_-]+$",
};

export const policySchema: JSONSchema4 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Headscale ACL Policy Schema",
  type: "object",
  additionalProperties: false,
  properties: {
    groups: {
      type: "object",
      additionalProperties: false,
      title: "Groups",
      description:
        "Collections of users having a common scope\nhttps://tailscale.com/kb/1337/policy-syntax#groups",
      errorMessage: 'Must start with the prefix "group:".',
      patternProperties: {
        [regexes.group]: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/User",
                errorMessage: 'Must include "@".',
              },
            ],
          },
        },
      },
    },
    tagOwners: {
      type: "object",
      additionalProperties: false,
      title: "TagOwners",
      description:
        "Association between a tag and the people allowed to use it\nhttps://tailscale.com/kb/1337/policy-syntax#tag-owners",
      errorMessage: 'Must start with the prefix "tag:".',
      patternProperties: {
        [regexes.tag]: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/User",
                errorMessage: "Must be one of: user, group.",
              },
              {
                $ref: "#/$defs/Group",
                errorMessage: "Must be one of: user, group.",
              },
            ],
            additionalProperties: false,
          },
        },
      },
    },
    hosts: {
      type: "object",
      additionalProperties: false,
      title: "Hosts",
      description:
        "Human-friendly names for IP addresses and subnets\nhttps://tailscale.com/kb/1337/policy-syntax#hosts",
      errorMessage: 'Cannot contain "@".',
      patternProperties: {
        "^((?!@).)*$": {
          anyOf: [
            {
              $ref: "#/$defs/IpV4",
              errorMessage: "Must be a valid IP or CIDR.",
            },
            {
              $ref: "#/$defs/IpV6",
              errorMessage: "Must be a valid IP or CIDR.",
            },
            {
              $ref: "#/$defs/CidrV4",
              errorMessage: "Must be a valid IP or CIDR.",
            },
            {
              $ref: "#/$defs/CidrV6",
              errorMessage: "Must be a valid IP or CIDR.",
            },
          ],
        },
      },
    },
    acls: {
      type: "array",
      additionalItems: false,
      additionalProperties: false,
      title: "ACLs",
      description:
        "Access control rules defining who can access what\nhttps://tailscale.com/kb/1337/policy-syntax#acls",
      items: {
        type: "object",
        required: ["action", "src", "dst"],
        additionalProperties: false,
        properties: {
          action: {
            type: "string",
            enum: ["accept"],
            errorMessage: 'Must be "accept".',
          },
          proto: {
            type: "string",
            errorMessage: "Must be a valid known protocol.",
            enum: [
              "icmp",
              "igmp",
              "ipv4",
              "ip-in-ip",
              "tcp",
              "egp",
              "igp",
              "udp",
              "gre",
              "esp",
              "ah",
              "ipv6-icmp",
              "sctp",
              "fc",
              "*",
            ],
          },
          src: {
            type: "array",
            items: {
              anyOf: [
                {
                  $ref: "#/$defs/User",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/Group",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/Tag",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/Autogroup",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/IpV4",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/IpV6",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/CidrV4",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  $ref: "#/$defs/CidrV6",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
                {
                  type: "string",
                  enum: ["*"],
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, IP, CIDR, or "*".',
                },
              ],
            },
          },
          dst: {
            type: "array",
            items: {
              anyOf: [
                {
                  $ref: "#/$defs/UserWithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/GroupWithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/TagWithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/AutogroupWithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/IpV4WithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/IpV6WithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/CidrV4WithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  $ref: "#/$defs/CidrV6WithPort",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
                {
                  type: "string",
                  pattern: "^\\*:((\\*|\\d+),?){1,}(?<!,)$",
                  errorMessage:
                    'Must be in format: "destination:port". Destination may be one of: user, group, tag, autogroup, IP, CIDR, or "*". Port can be specific ports separated by comma or "*" for any port.',
                },
              ],
            },
          },
        },
      },
    },
    ssh: {
      type: "array",
      additionalItems: false,
      additionalProperties: false,
      title: "SSH",
      description:
        "Rules defining who can SSH into what\nhttps://tailscale.com/kb/1337/policy-syntax#tailscale-ssh",
      items: {
        type: "object",
        required: ["action", "src", "dst", "users"],
        additionalProperties: false,
        properties: {
          action: {
            type: "string",
            enum: ["accept", "check"],
            errorMessage: 'Must be one of: "accept", "check".',
          },
          src: {
            type: "array",
            items: {
              anyOf: [
                {
                  $ref: "#/$defs/User",
                  errorMessage: "Must be one of: user, group, tag, autogroup.",
                },
                {
                  $ref: "#/$defs/Group",
                  errorMessage: "Must be one of: user, group, tag, autogroup.",
                },
                {
                  $ref: "#/$defs/Tag",
                  errorMessage: "Must be one of: user, group, tag, autogroup.",
                },
                {
                  $ref: "#/$defs/Autogroup",
                  errorMessage: "Must be one of: user, group, tag, autogroup.",
                },
              ],
            },
          },
          dst: {
            type: "array",
            items: {
              anyOf: [
                {
                  $ref: "#/$defs/User",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, "*".',
                },
                {
                  $ref: "#/$defs/Group",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, "*".',
                },
                {
                  $ref: "#/$defs/Tag",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, "*".',
                },
                {
                  $ref: "#/$defs/Autogroup",
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, "*".',
                },
                {
                  type: "string",
                  enum: ["*"],
                  errorMessage:
                    'Must be one of: user, group, tag, autogroup, "*".',
                },
              ],
            },
          },
          users: {
            type: "array",
            items: {
              type: "string",
              // pattern: "^[A-Za-z0-9._-]+$",
            },
          },
        },
      },
    },
    autoApprovers: {
      type: "object",
      additionalProperties: false,
      title: "AutoApprovers",
      description:
        "Defines the list of users who can perform specific actions without further approval\nhttps://tailscale.com/kb/1337/policy-syntax#auto-approvers",
      properties: {
        routes: {
          type: "object",
          additionalProperties: false,
          errorMessage: "Must be a valid CIDR.",
          patternProperties: {
            "^\\d+\\.\\d+\\.\\d+\\.\\d+\\/\\d{1,2}$": {
              type: "array",
              items: {
                anyOf: [
                  {
                    $ref: "#/$defs/User",
                    errorMessage:
                      "Must be one of: user, group, tag, autogroup.",
                  },
                  {
                    $ref: "#/$defs/Group",
                    errorMessage:
                      "Must be one of: user, group, tag, autogroup.",
                  },
                  {
                    $ref: "#/$defs/Tag",
                    errorMessage:
                      "Must be one of: user, group, tag, autogroup.",
                  },
                  {
                    $ref: "#/$defs/Autogroup",
                    errorMessage:
                      "Must be one of: user, group, tag, autogroup.",
                  },
                ],
              },
            },
          },
        },
        exitNode: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/User",
                errorMessage: "Must be one of: user, group, tag, autogroup.",
              },
              {
                $ref: "#/$defs/Group",
                errorMessage: "Must be one of: user, group, tag, autogroup.",
              },
              {
                $ref: "#/$defs/Tag",
                errorMessage: "Must be one of: user, group, tag, autogroup.",
              },
              {
                $ref: "#/$defs/Autogroup",
                errorMessage: "Must be one of: user, group, tag, autogroup.",
              },
            ],
          },
        },
      },
    },
  },
  $defs: {
    User: {
      type: "string",
      pattern: "(?=.*@)",
    },
    UserWithPort: {
      type: "string",
      pattern: "^(\\S+)@(\\S+)?:((\\*|\\d+),?){1,}(?<!,)$",
    },
    Group: {
      type: "string",
      pattern: regexes.group,
    },
    GroupWithPort: {
      type: "string",
      pattern: "^group:[A-Za-z0-9._-]+:((\\*|\\d+),?){1,}(?<!,)$",
    },
    Tag: {
      type: "string",
      pattern: regexes.tag,
    },
    TagWithPort: {
      type: "string",
      pattern: "^tag:[A-Za-z0-9_-]+:((\\*|\\d+),?){1,}(?<!,)$",
    },
    Autogroup: {
      type: "string",
      pattern: "^autogroup:[A-Za-z-]+$",
    },
    AutogroupWithPort: {
      type: "string",
      pattern: "^autogroup:[A-Za-z-]+:((\\*|\\d+),?){1,}(?<!,)$",
    },
    IpV4: {
      type: "string",
      // pattern: "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$",
      format: "ipv4",
    },
    IpV4WithPort: {
      type: "string",
      pattern:
        "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}:((\\*|\\d+),?){1,}(?<!,)$",
    },
    IpV6: {
      type: "string",
      // pattern: "^[0-9A-Fa-f:]+$",
      format: "ipv6",
    },
    IpV6WithPort: {
      type: "string",
      pattern: "^[0-9A-Fa-f:]+:((\\*|\\d+),?){1,}(?<!,)$",
    },
    CidrV4: {
      type: "string",
      pattern: "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}(\\/\\d{1,2})$",
    },
    CidrV4WithPort: {
      type: "string",
      pattern:
        "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}(\\/\\d{1,2}):((\\*|\\d+),?){1,}(?<!,)$",
    },
    CidrV6: {
      type: "string",
      pattern: "^[0-9A-Fa-f:]+\\/[0-9]{1,3}$",
    },
    CidrV6WithPort: {
      type: "string",
      pattern: "^[0-9A-Fa-f:]+\\/[0-9]{1,3}:((\\*|\\d+),?){1,}(?<!,)$",
    },
  },
};
