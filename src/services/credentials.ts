import crypto from "crypto";
import Ajv from "ajv";
import base64 from "react-native-base64";
import { Buffer } from "buffer";
import { Role, User } from "./db/users";

const ajv = new Ajv();

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzpeRei7hdRMg05xEr2NI
hRSwKcnjdM9/sxpdnGBd3Hkz0lkJrOMcIQXr3Zo2+HJGGGnNLYzKb+KJ758Qg1Ge
+8qkdhVpMFOILDIJLIIquLoHCjTfPTkhmLEwLtd1yKlQMupD/66LdAMEEr0tKk7n
SD+uJO4Lbf7Hxp2hkyA/BhXQQswTHM80x3WpFkUIrmG7sm4WSzb9yF0tuOv670Aq
Hqc1VqMXW/uEwtAI6NHWGS3zX2mjLcwScoyo8V2SEDtzoVhg6aTdHPUTGXgNloxI
w4VQXg4ablAGqCJrSeiX8aor+PhUIvOU8bIQFx5QTZoL5jtFXE3JkVJ7LMQo1lJP
SwB5FN8fnOEiAddZekDYk81dzRAB0zDfz9Gv+JC35o4FN+Ak5gIeiJfx9X/osI8P
7niI8BzflbvajbUQ+D0UmB0spqy083ESNEMfiO01Qr9m2PAzS7hpNVz9o2pBCwY6
aJEGGsEdo/Pfa2ztqu1ocKeLZf51UNwGIFPgCFyEEmepbwzpZMBBroPCSm5Ip9mZ
at9PfPomySk9RdlQ4UZ8iswsD0FFJOYcls2QTghaRCr/6LeCdH/G/V/yucURHaV4
oIcuKkCCGPp0d0/AP8+QzxVKLSpSb1dp0XuqhoL3oL5158aWJHrUOeA5LDH8RKRA
6GJuW+YZy1uPAP5hsqjayTECAwEAAQ==
-----END PUBLIC KEY-----` 
const SHA256_ASN1_PREFIX = Buffer.from("3031300d060960864801650304020105000420", "hex");

enum Reason {
  PRIVATE_KEY_NOT_DEFINED,
  INVALID_CREDENTIAL,
}

class CredentialError extends Error {
  reason: Reason;
  message: string;
  cause?: any;

  constructor(reason: Reason, message: string, cause?: any) {
    super();
    this.reason = reason;
    this.message = message;
    this.cause = cause;
  }
}

class Credential {
  id: number;

  constructor(
    id: number,
  ) {
    this.id = id;
  }

  static toBase64(credential: Credential): string {
    return base64.encode(JSON.stringify(credential));
  }

  static fromBase64(credential: string): Credential {
    const parsed = JSON.parse(base64.decode(credential));
    const isValid = ajv.validate(credentialSchema, parsed);
    if (!isValid) {
      throw new CredentialError(
        Reason.INVALID_CREDENTIAL,
        "Credential is not valid",
      );
    }
    return parsed;
  }

  setId(id: number) {
    this.id = id;
  }
}

const credentialSchema = {
  type: "object",
  properties: {
    id: {
      type: "number",
    },
  },
  required: ["id"],
};

class CredentialService {
  async decrypt(credentials: { signature: string, data: any }): Promise<Credential> {
    console.log("credentials: ", credentials.signature)
    const decrypted = crypto.publicDecrypt(
      {
        key: PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      // openssl pkeyutl -encrypt -inkey keyfile.pub -pubin -in user.json -out encrypted.bin -keyform PEM -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256
      Buffer.from(credentials.signature, "base64"),
    );

    // Check if the decrypted signature starts with the SHA-256 prefix
    if (!decrypted.subarray(0, SHA256_ASN1_PREFIX.length).equals(SHA256_ASN1_PREFIX)) {
      console.error("Invalid signature")
      throw new Error("Invalid signature format or hash algorithm mismatch");
    }

    // Extract the actual hash
    const decryptedHash = decrypted.subarray(SHA256_ASN1_PREFIX.length);
    const dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(credentials.data))
      .digest('hex')
    const isValid = decryptedHash.toString('hex') === dataHash
    if (!isValid) {
      console.error('invalid')
      throw new CredentialError(
        Reason.INVALID_CREDENTIAL,
        "The credential is not valid",
      );
    }
    return credentials.data
  }

  validate(user: User, credential: Credential): boolean {
    let valid = true;
    valid = valid && user.name === credential.name;
    valid = valid && user.lastname === credential.lastname;
    valid = valid && user.email === credential.email;
    valid = valid && user.dni === credential.dni;
    valid = valid && user.role.valueOf() === credential.role.valueOf();
    if (credential.valid_from && user.valid_from) {
      const credFrom = new Date(Date.parse(credential.valid_from))
      const userFrom = new Date(Date.parse(user.valid_from))

      valid = valid && userFrom.getTime() === credFrom.getTime();
    }
    if (credential.valid_to && user.valid_to) {
      const credTo = new Date(Date.parse(credential.valid_to))
      const userTo = new Date(Date.parse(user.valid_to))

      valid = valid && userTo.getTime() === credTo.getTime();
    }
    return valid;
  }
}

const credentialService = new CredentialService();

export { credentialService, Credential };
