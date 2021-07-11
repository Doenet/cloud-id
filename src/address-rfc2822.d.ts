declare module 'address-rfc2822' {
  interface EmailAddress {
    address: string;
  }
  
  export function parse(a: string) : Array<EmailAddress>;
}
