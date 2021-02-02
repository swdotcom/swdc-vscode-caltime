import { Integration } from "./Integration";

export class SoftwareUser {
  public id: number;
  public registered: number;
  public email: string;
  public integrations: Integration[];
  public plugin_jwt: string;
}