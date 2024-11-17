import Enum from './enum.js';
const { log, table, clear } = console;

const daysOfWeek = new Enum('daysOfWeek', {
  Monday: '',
  Tuesday: 0,
  Wednesday: Infinity,
  Thursday: { a: true, b: 78 },
  Friday: (c) => {
    console.log(c);
  },
  Saturday: -57,
  Sunday: '4'
});

log(daysOfWeek.Monday);
log(daysOfWeek.Monday.int);
log(daysOfWeek[0]);
for (const day in daysOfWeek) {
  log(day);
}
for (const val of daysOfWeek) {
  log(val);
  log(daysOfWeek[val]);
  log(daysOfWeek[val].int);
}
clear();
const daysOfBits = new Enum(
  'daysOfBits',
  {
    0: (a) => {
      return `oops, empty for bitmask ${a}`;
    },
    Monday: '',
    Tuesday: 0,
    Wednesday: Infinity,
    Thursday: { a: true, b: 78 },
    Friday: (c) => {
      console.log(c);
    },
    Saturday: -57,
    Sunday: null
  },
  Enum.flags
);

log(daysOfBits.Monday); // 1
log(daysOfBits[8]); // Thursday
log(daysOfBits.entries(18 & 7)); // ['Tuesday']
for (const day in daysOfBits) {
  log(day); // 1,2,4,8,16,32,64
  log(daysOfBits[day]); // Monday ... Sunday
}
log(daysOfBits.values(1 << 26)); // oops, empty for bitmask 67108864

clear();
const WebEvent = new Enum(
  'WebEvent',
  {
    PageLoad: 'constructor',
    PageUnload: 1,
    KeyPress: 'char',
    Paste: 'string',
    Click: { x: 'int', y: 'int', z: [null, 'bool', Symbol(`should be a str`)] }
  },
  Enum.symbolic
);

WebEvent.match = {
  PageLoad(val) {
    log(val.description);
    return 8;
  },
  PageUnload(val) {
    log(val.description);
  },
  KeyPress(val) {
    log(val);
  },
  Paste(val) {
    log(val);
  },
  Click(obj) {
    log(obj.z);
  }
};

const load = WebEvent.PageLoad;
const unload = WebEvent.PageUnload;
const press = WebEvent.KeyPress('xfgh');
const paste = WebEvent.Paste('hello');
const click = WebEvent.Click({
  x: 59.92,
  y: '77.1',
  z: [false, true, { location: 'here' }]
});

log(WebEvent.Click.schema);
log(WebEvent.match(load));
WebEvent.PageLoad.match = (v) => {
  log(v.description + 5886);
};
log(WebEvent.match(load));
WebEvent.Click.match = (obj) => {
  return obj.x;
};
log(WebEvent.match(click));
for (const key in click) {
  log(key);
}
for (const val of click) {
  log(val);
}

clear();
const permissions = new Enum('permissions', {
  Read: 1,
  Delete: 2,
  Write: 4,
  Mod: 5,
  Admin: 7
});

const permissionsBits = new Enum(
  'permissionsBits',
  {
    Read: 1,
    Delete: '',
    Write: true,
    Mod: 5,
    Admin: 99
  },
  Enum.flags
);

log(permissions[permissions.Read.int | permissions.Write.int]); // Mod
log(permissions[permissions.Read.int | permissions.Write.int | permissions.Delete.int]); // Admin
log(
  permissionsBits[1 + (permissionsBits.Read | permissionsBits.Write | permissionsBits.Delete)] // Mod
);
const mod = permissionsBits.Read | permissionsBits.Write; // 5
log(permissions.values(7)); // ['Read, Delete, Write']
log(permissions.entries(7).print); // 'Read, Delete, Write'
log(permissionsBits.keys(mod)); // [1, 4]
log(permissionsBits.values(1 << 15)); // undefined

// Admin is it's own bit, Admin-1 is a superset of preceding bits
const admin =
  permissionsBits.Read | permissionsBits.Delete | permissionsBits.Write | permissionsBits.Mod; // 15
const allFlags = permissionsBits.size ** 2 - 1; // 24
const adminBit = (permissionsBits.size - 1) ** 2 - 1; // 15
log(adminBit === permissionsBits.Admin - 1); // true

if ((adminBit | permissionsBits.Delete) === permissionsBits.Admin - 1) {
  // Admin-1 contains Delete bit so adding it should change nothing
  log('is Admin');
  if ((admin & allFlags) === allFlags) {
    // Admin or Admin-1 does not stand above Admin
    // No one field can represent all flags of the Enum
    log('is Above All');
  }
} else {
  log('is Mod');
}
