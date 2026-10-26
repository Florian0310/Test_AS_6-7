import * as migration_20261026_112236_audit_initial from './20261026_112236_audit_initial';
import * as migration_20261026_163132_cms_roles from './20261026_163132_cms_roles';

export const migrations = [
  {
    up: migration_20261026_112236_audit_initial.up,
    down: migration_20261026_112236_audit_initial.down,
    name: '20261026_112236_audit_initial',
  },
  {
    up: migration_20261026_163132_cms_roles.up,
    down: migration_20261026_163132_cms_roles.down,
    name: '20261026_163132_cms_roles'
  },
];
