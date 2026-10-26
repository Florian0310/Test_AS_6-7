import * as migration_20261026_112236_audit_initial from './20261026_112236_audit_initial';

export const migrations = [
  {
    up: migration_20261026_112236_audit_initial.up,
    down: migration_20261026_112236_audit_initial.down,
    name: '20261026_112236_audit_initial'
  },
];
