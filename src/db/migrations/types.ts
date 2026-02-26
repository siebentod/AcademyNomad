export interface Migration {
  name: string;
  description: string;
  up: (db: any) => Promise<void>;
}
