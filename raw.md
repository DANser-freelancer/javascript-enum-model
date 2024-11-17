# Overvview

This is a file that describes the use of enum.mjs in it's current raw form, as if you simpy inserted it into your codebase.  
To avoid repeating myself, this will be a verbose recap of **what** my code does, while my codebase combined with jsdoc will tell you **how**.

# Enum

It's a parent global Enum class (javascript already has `Object`, `String` etc.), used to create new enums.  
In the case of this feature prototype, it is not only constistently **enumerable** but also **iterable**.  
Different types of enums provide different benefits, but all of them are immutable.  
If you are questioning my design decisions, here are my sources:

- [C# enumeration](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum)
- [Rust enumeration](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html)
- [my brain](https://www.youtube.com/watch?v=CWExUQcTxB8)

> [!NOTE]  
> When I say _"like in x language"_, I mean I borrowed some ideas from the language, and made it fit into javascript.  
> I have been writing vanilla javascript for a long time now.  
> I don't posess the same level of expertise to implement an exact copy of the Enum from another language.  
> And either way - I don't have to do that.

#### Prototype <!-- #prototype -->

**Public properties:**

- Static:

  1. `.flags` - control tag[^control_tag], enables creation of [Enum](#enum) structured as a collection of flags
  2. `.symbolic` - control tag[^control_tag], enables creation of [Enum](#enum) with [EnumVariants](#enumvariant) that hold values
  3. `.simple` - control tag[^control_tag], default, enables creation of a simple C style [Enum](#enum)
  4. `.types` - table of transformators for types[^type_annotations] used in the schema[^schema] of [EnumVariants](#enumvariant)
  5. `.check()` - validator function for the keys of a structure object[^structure_object], fails if:
     - the keys cannot be considered valid variable names[^variable_names] (e.g. `const 57` or `<obj>.*fish`)
     - or they collide with already existing properties (e.g `<enum>['[[metadata]]']` or `<obj>.constructor`)
  6. `.match(callbacks, <EnumVariant>)` - pattern matching[^pattern_matching] function, imitates the `match` expression in Rust
     - it accepts callbacks for all possible variants and runs the appropriate function once it finds the match
     - the function will be given the value of the matched variant
     - throws if you do **not** have a function for **every** possible variant
  7. `.checkType()` - checks if a string represents one of the types[^type_annotations] used in a schema[^schema]

- Instance:
  1. `.values(<int>)` - returns an array of names matching the bitmask[^bitmasking]
     - `<arr>.print` returns a CCS _(comma separated string)_ of all values
     - `Enum.simple` and `Enum.flags` only
  2. `.keys(<int>)` - returns an array of integers matching the bitmask[^bitmasking]
     - `<arr>.print` returns a CCS of all keys
     - `Enum.simple` and `Enum.flags` only
  3. `.entries(<int>)` - returns an array of `[value:key]` pairs matching the bitmask[^bitmasking]
     - `<arr>.print` returns a CCS of all entries, formatted as `<value>(<key>), `
     - `Enum.simple` and `Enum.flags` only
  4. `<enum>.match =` - non-enumerable, sets a default object of callbacks for pattertn matching[^pattern_matching] on this [Enum](#enum) instance
     - `Enum.symbolic` only
  5. `<enum>.match()` - shortcut to `Enum.match()`, that uses default callbacks
     - `Enum.symbolic` only
  6. `<enum>.size` - same as `Object.keys(<enum>).length`, may be useful for bitmasking[^bitmasking]
     - `Enum.simple` and `Enum.flags` only

**Private properties:**

- Instance:

  1. `.#form` - object of default callbacks for pattern matching[^pattern_matching]

#### Initialization

> [!IMPORTANT]  
> [Enum](#enum) can only be initialized with a `{}` object, it does **not** accept level-0 arrays  
> (i.e. array as a structure object[^structure_object] of the enum)

[^variable_names]: By variable naming rules I mean legal syntax, for more detail see [Identifiers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variables)

[^control_tag]: **Control tags** are symbols used to change the functionality and output of the [Enum](#enum) constructor

[^type_annotations]: **Types** in a schema[^schema] tell the [EnumVariant](#enumvariant) constructor how to transform values passed in

[^schema]: **Schema** is an object that acts as the blueprint for new [EnumVariants](#enumvariant), it defines the structure and the types[^type_annotations] of the values

[^complex_value]: **Complex value** is the opposite of a primitive[^primitive_value], usually an object or function

[^primitive_value]:
    **Primitive value** is a non-extensible value, without properties, which is not an instance. Example:

    - `typeof 'hello' === 'string'` is **true** and `'hello' instanceof String` is **false**
    - `typeof new String('hello') === 'string'` is **false** and `new String('hello') instanceof String` is **true**
    - FTPS[^FTPS] we can ignore the fact that javascript primitives are not fully primitive, [for reference](https://github.com/DANser-freelancer/code_bits)
    - FTPS[^FTPS] `Symbol`s act similarly to primitives

[^FTPS]: **For This Project's Scope** - for the logic, functionality, use case, and general idea behind this code

[^structure_object]: **Structure object** is the input object used to define the layout and values of the new [Enum](#enum) or layout and types[^type_annotations] of the new [EnumVariant](#enumvariant)

[^pattern_matching]: `Enum.match()` function works like a `switch` statement, that is an expression, that forces you to consider every possible [EnumVariant](#enumvariant) case for a certain [Enum](#enum)

[^bitmasking]: A number can be used as a set of binary flags where bit `1/0` is `true/false`. In this case each bit corresponds to an individual field in the [Enum](#enum) (e.g `11` is binary `1011` or **fourth, second, first** fields)

# EnumVariant

A subclass of [Enum](#enum) designed to serve as a constructor in the fields of `Enum.symbolic`.

#### Prototype

**Public properties:**

- Static:
  1. `.buildSchema(<obj>, <enum>)` - function to parse the structure object[^structure_object] and return a schema[^schema]
  2. `.applySchema(<obj>, <schema>)` - function to parse the source object[^source_object] and return a converted object copy
- Instance:
  1. `<enumvar>.match =` - non-enumerable, sets new matching function for the relevant [EnumVariant](#enumvariant)
     - **not available** on constructed variant instances

**Private properties:**

- Inherited

#### Initialization

> [!CAUTION]  
> Manually creating [EnumVariants](#enumvariant) can lead to unexpected problems!  
> ❌ Do **not** create `new EnumVariant()`  
> ✔️ **Do** use `bound builder()` functions placed in the [Enum](#enum)  
> ❔ **Can** use static methods of `class EnumVariant`

An [EnumVariant](#enumvariant) is either prebuilt or constructed by invoking an enum field closure with `<enum>.<prop>(<val>)`

#### Structure

The structure of the [EnumVariant](#enumvariant) is decided at the time of [Enum](#enum) declaration.

- `.value` is a default field used for single value [Enum](#enum) fields
- if the enum field contained a complex value[^complex_value] at the time of declaration
  - all instances will follow it's shape and types[^type_annotations]
  - `.value` will **not** be added by default
- [EnumVariant](#enumvariant) can handle both `{}` and `[]` objects

#### bound builder()

If an [Enum](#enum) field contained a valid type[^type_annotations] or a complex value[^complex_value] a bound constructor function `builder()` is placed there, otherwise an [EnumVariant](#enumvariant) containing a `Symbol` is placed.

- `<builder>.schema` - a copy of the schema[^schema] used by the builder
- `<builder>.match =` - updates the default matching callback for the relevant [EnumVariant](#enumvariant)

## [[metadata]]

Is a non-enumerable field (object) present in every [Enum](#enum) and [EnumVariant](#enumvariant).  
It contains mechanically important information and changes structure based on the kind of [Enum](#enum).

- `metadata.title` and `metadata.type` occur in all types of [Enum](#enum)
- `metadata.parent` occurs in all instances of [EnumVariant](#enumvariant)

It is named this way for 2 reasons:

1. that's how runtime-only properties look in dev tools (i.e. `[[PrimitiveValue]]` of a `Number`)
2. it avoids collisions since `[` is an invalid character for a variable name

## Enum.simple

A simple C style enum, each field gets an integer value associated with it.

### Usage

Its main purpose is to allow programmers to use readable constants, that translate to a primitive integer value _(compiler benefit)_.  
It also allows you to define _fusions_ (i.e. `5` or `101` is a fusion of `4|1`).

### Syntax

#### Initialization

To create an [Enum](#enum) give it:

1. a name string,
2. a structure object[^structure_object],
3. undefined or `Enum.simple`

#### Property access

To access any field in the enum:

- write `enum.<prop>`
  - manual access by _field name_ is designed to imitate C# _casting field to integer_, via `enum.<prop>.int`
- or `enum[<int>]`
  - manual access by _integer_ is is designed to imitate C# _casting enum to integer_, via `enum[<int>]`
- or `enum[enum.<prop>.int]`, but that is unnecessary, and this format can just keep getting nested

### Structure

The structure object[^structure_object] is only accepted with fields that pass the [validation](#prototype), and any value that is not a valid number is ignored.  
By default each field's integer is assigned automatically, based on the order of insertion.  
You can override the integer value with a valid number. Example:

```javascript
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
```

1. `Monday` is automatically assigned `0`
2. `Tuesday` manually takes the spot of `Monday`, `Monday` is moved to `1`
3. every other field is automatically assigned numbers `2-6`
4. except that `Saturday` is assigned `-57` and therefore `5` doesn't exist

A sorting mechanism will ensure that you do not create duplicate integer associations, and do not overwrite any of the fields.

Every field in the enum becomes a string value.
For each field, 2 properties are defined on the resulting enum:

- `enum.<prop>` is non-enumerable, and will contain a `String(<prop>)`
  - that string object will also posess an `.int` property
- `enum[<int>]` is enumerable, and will contain a primitive string of `<prop>`
  - this way integers are **keys**, and field names are **values** in any enumeration operation (i.e. `Object.keys()`)
  - the enum will be enumerated in the correct order, independent of the field names

### Behavior

```javascript
log(daysOfWeek.Monday); // String('Monday')
log(daysOfWeek.Monday.int); // 1
log(daysOfWeek[0]); // Tuesday
for (const day in daysOfWeek) {
  log(day); // 0,1,2,3,4,6,-57
}
for (const val of daysOfWeek) {
  log(val); // Tuesday ... Saturday
  log(daysOfWeek[val]); // String('Tuesday') ... String('Saturday')
  log(daysOfWeek[val].int); // 0 ... -57
}
```

## Enum.flags

A C# `[Flags]` style enum structured as a collection of flags.

### Usage

It is similar to `Enum.simple`, but its main purpose is to have clearly defiend, individual bit fields.  
It is structured as a collection of flags.  
It also allows you to define _supersets_ (i.e. `8` is one bit `1000`, whilst `7` is a superset `0111` of bits `4|2|1`)

### Syntax

#### Initialization

To create an [Enum](#enum) give it:

1. a name string,
2. a structure object[^structure_object],
3. `Enum.flags`

#### Property access

To access any field in the enum:

- write `enum.<prop>`
  - manual access by **field name** returns an integer that is always a standalone flag
- or `enum[<int>]`
  - manual access by **integer** is is designed to imitate C# _casting enum to integer_, via `enum[<int>]`

### Structure

The structure object[^structure_object] is only accepted with fields that pass the [validation](#prototype), and any value is ignored[^field0].
Each field's integer is assigned automatically, based on the order of insertion.  
Consider example similar to the previous object:

[^field0]: field `0` is reserved for a default action from bitmasking[^bitmasking] methods (i.e. `<enum>.values()`) if they fail to find a match

```javascript
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
```

1. `Monday` is automatically assigned `1`
2. `Tuesday` is automatically assigned `2`
3. `Thursday` is automatically assigned `8`
4. enum integers are different bitshifts of `1` that end at `-2147483648`
   - this is done to simplify bit loops and individual bit access, since you can simply write `1<<i`
   - `-2147483648` is simply a negative of the 32nd bit
   - the enum is limited to only 32 fields because javacript bitwise operators only deal with 32bit numbers
5. value from the field `0` in the structure object is **not** ignored
   - it is expected to be a function
   - the resulting enum will contain a non-enumerable property `0`
   - by default `<enum>[0]()` will be a function that returns `undefined`

Every field in the enum becomes a string value.
For each field, 2 properties are defined on the resulting enum:

- `enum.<prop>` is non-enumerable, and will contain a `number` primitive[^primitive_value] of `<int>`
- `enum[<int>]` is enumerable, and will contain a string primitive[^primitive_value] of `<prop>`
  - this way integers are **keys**, and field names are **values** in any enumeration operation (e.g. `Object.keys()`)

### Behavior

```javascript
log(daysOfBits.Monday); // 1
log(daysOfBits[8]); // Thursday
log(daysOfBits.entries(18 & 7)); // ['Tuesday']
for (const day in daysOfBits) {
  log(day); // 1,2,4,8,16,32,64
  log(daysOfBits[day]); // Monday ... Sunday
}
log(daysOfBits.values(1 << 26)); // oops, empty for bitmask 67108864
```

## Enum.symbolic

A Rust style enum that doesn't have integer associations and instead holds constructors or identifiers.  
This particular enum was much too complicated to implement so it likely doesn't work the same way as in Rust.

### Usage

Its main purpose is to introduce a collection of constructors/signature values, that allow it to hold different values and pattern match[^pattern_matching].

### Syntax

#### Initialization

To create an Enum give it:

1. a name string,
2. a structure object[^structure_object],
3. `Enum.symbolic`

#### Property access

Property access it a _little bit_ more complicated.

- fields with a unique identifier
  - such field will be an [EnumVariant](#enumvariant) accessible on the [Enum](#enum) itself
  - to access the value write `<enum>.<prop>.value`
- fields with a single value constructor
  - first you will have to construct an [EnumVariant](#enumvariant) instance via `<enum>.<prop>(<val>)`
  - to access the value write `<instance>.value`
    - you can also access the constructor's schema[^schema] via `<enum>.<prop>.schema`
- fields with a complex[^complex_value] value constructor
  - first you will have to construct an [EnumVariant](#enumvariant) instance via `<enum>.<prop>(<val>)`
  - such instances do not have a default field `.value`
  - to access any value you can ask for any property that was on the structure object[^structure_object]
    - you can also access the constructor's schema[^schema] via `<enum>.<prop>.schema`

### Structure

The structure object[^structure_object] is only accepted with fields that pass [validation](#prototype), and the values are parsed.  
Keep in mind that I had to adjust the idea of this kind of enum to play nice with javascript.  
Here is an example from the rust-by-example page, with some modifications:

```javascript
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
```

Each field will eventually be an [EnumVariant](#enumvariant).  
It can either be prebuilt, or await input to create a new instance.  
Let's break down the different kinds of fields you can have:

- **Unique identifier, used for references:**  
  A field in the enum may be treated as just a constant.
  This is the case when you declare a field with a value that is neither an object nor a type[^type_annotations].  
  Example:
  1. `WebEvent.PageLoad` was declared with an invalid value
  2. the field name is used to create a `Symbol`
     - this way 2 identical fields from 2 diferent enums are **not** equal, but their descriptions are
  3. `WebEvent.PageLoad` is now a prebuilt [EnumVariant](#enumvariant)
- **Single value constructor:**  
  A field in the enum can be declared with just a type[^type_annotations].  
  In that case, it becomes a constructor of single values, usually primitive[^primitive_value].  
  Example:
  1. `WebEvent.KeyPress` was declared with `'char'`, which is one of the available types[^type_annotations]
  2. schema[^schema] is built for the singular type annotation
     - it looks like this `{ value: 'char' }`
  3. `WebEvent.KeyPress` is now a [bound builder()](#bound-builder)
     - it will accept a value and, in standard javascript fashion, try to convert it
     - this will create an instance of [EnumVariant](#enumvariant)
     - you can keep creating more `WebEvent.KeyPress` instances
- **Complex constructor:**  
  A field in the enum can be declared with an object containing one or more fields.  
  In that case, it becomes a constructor of objects.  
  Each fields value is expected to be either a type[^type_annotations] or an object; in case it is neither, it's treated as a `'str'` type[^type_annotations]  
  Example:
  1. `WebEvent.Click` is declared with an object
  2. the object is recursively processed and a schema[^schema] is built
     - it loks like this `{ x: 'int', y: 'int', z: ['str', 'bool', 'str'] }`
  3. `WebEvent.Click` is now a [bound builder()](#bound-builder)
     - it will accept an object of values and, in standard javascript fashion, try to convert them
     - this will create an instance of [EnumVariant](#enumvariant)
     - you can keep creating more `WebEvent.Click` instances

### Behavior

```javascript
const load = WebEvent.PageLoad;
const unload = WebEvent.PageUnload;
const press = WebEvent.KeyPress('xfgh');
const paste = WebEvent.Paste('hello');
const click = WebEvent.Click({
  x: 59.92,
  y: '77.1',
  z: [false, true, { location: 'here' }]
});
```

Here are the resulting values, all of which are instances of [EnumVariant](#enumvariant):

1. `load`
   - `load.value` is a `Symbol(PageLoad)`
2. `unload`
   - `unload.value` is a `Symbol(PageUnload)`
3. `press`
   - `press.value` is `'x'`
4. `paste`
   - `paste.value` is a `String('hello')`
5. `click`
   - does **not** have a default property `.value` but could have `.value` if declared by the user
   - `.x` is `59`
   - `.y` is `77`
   - `.z` is an array of `['false', true, '[object Object]']`

## Advanced

#### Enum.flags

```javascript
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
```

#### Enum.symbolic

```javascript
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

log(WebEvent.Click.schema); // {x: 'int', y: 'int', z: ['str', 'bool', 'str']}
log(WebEvent.match(load)); // logs PageLoad, returns and logs 8
WebEvent.PageLoad.match = (v) => {
  log(v.description + 5886);
};
log(WebEvent.match(load)); // logs PageLoad5886, returns and logs undefined
WebEvent.Click.match = (obj) => {
  return obj.x;
};
log(WebEvent.match(click)); // 59
for (const key in click) {
  log(key); // x, y, z
}
for (const val of click) {
  log(val); // 59, 77, ['false', true, '[object Object]']
}
```

## Afterword

The details of methods and structures here described are pretty self explanatory.  
Once you look at the code, and run examples.js a couple of times with debugger, you'll get it.  
Feedback on the syntax, memory efficiency, bugs is welcome in the issues section.  
I will deploy it as a package, but consider this an experiment, because I've had to take some roundabouts:

- for convenience's sake I decided to implement it using latest features like private and static class fields from **ES 2022**
- I had to "manifest" certain data that should ideally be dealt with by the ts compiler or by the runtime
  - I tried mimicking your average enum syntax best I could, but it's not completely convenient
  - `[[metadata]].name` exists simply for debugging purposes as the code can't read itself and know how you named the newly created [Enum](#enum)
  - [metadata](#[[metadata]]) object in general is a form of introspection, necessary for a functional "feature prototype"
  - one or more loops are often used to parse the Enum structure object[^structure_object] and then to parse source objects[^source_object]

However I encourage people to try out this [Enum](#enum) implementation.  
I believe this code can be rewritten to fit old enough versions of ECMAScript standard.  
This project is under the permissive free [license]("./LICENSE").

[^source_object]: **Source object** is similar to the structure object[^structure_object] but it's values are transformed according to the schema[^schema] and a new [EnumVariant](#enumvariant) instance is built
