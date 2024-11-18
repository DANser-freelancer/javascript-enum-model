/**
 * `[[metadata]]` object will be present in all instances of `Enum` and `EnumVariant`
 * - `metadata.title` and `metadata.type` occur in all types of `Enum`
 * - `metadata.parent` occurs in all instances of `EnumVariant`
 * @typedef {Object} metadata
 * @prop {string} metadata.title
 * @prop {symbol} metadata.type
 * @prop {Enum} [metadata.parent]
 */

export default class Enum {
  /**
   * @param {string} title - name of the `Enum`
   * @param {Object} obj - structure of the `Enum`
   * @param {symbol} [opt] - control tag to change the kind of `Enum`
   */
  constructor(title, obj, opt) {
    if (opt === undefined || opt === Enum.simple) {
      return Enum.#simple(title, obj, this);
    } else if (opt === Enum.flags) {
      return Enum.#flags(title, obj, this);
    } else if (opt === Enum.symbolic) {
      if (new.target.name !== 'EnumVariant') {
        Object.defineProperty(this, 'match', {
          get: this.#matchGetter,
          set: this.#matchSetter
        });
      } else if (typeof obj?.value == `symbol`) {
        Object.defineProperty(this, 'match', {
          set: (callback) => {
            const name = this['[[metadata]]'].title;
            if (typeof callback != `function`) {
              throw new SyntaxError(
                `Matcing expression for Enum variant ${name} must be a function`
              );
            }
            this['[[metadata]]'].parent.#form[name] = callback;
          }
        });
      }
      return Enum.#symbolic(title, obj, this, new.target);
    } else {
      throw new SyntaxError(
        `Enum option must be undefined or valid symbol from class Enum: \x1B[7;33m${
          opt?.toString ? opt.toString() : opt
        }\x1B[0m`
      );
    }
  }

  static flags = Symbol(`Enum structured as a collection of flags`);
  static symbolic = Symbol(`Enum suitable for pattern matching`);
  static simple = Symbol(`Enum suitable for integer associations`);

  /**
   * object of converters for schema types
   */
  static types = Object.freeze({
    str: (a) => {
      return String(a);
    },
    string: (a) => {
      return new String(a);
    },
    char: (a) => {
      return String(a)[0];
    },
    float: (a) => {
      return Number(a);
    },
    num: (a) => {
      return new Number(a);
    },
    int: (a) => {
      return Math.floor(a);
    },
    bin: (a) => {
      return a.toString(2);
    },
    hex: (a) => {
      return a.toString(16);
    },
    oct: (a) => {
      return a.toString(8);
    },
    boolean: (a) => {
      return new Boolean(a);
    },
    bool: (a) => {
      return Boolean(a);
    }
  });

  static #baseline = new Enum('', {});

  /**
   * builds simple `Enum`
   * @param {string} title - name of the `Enum`
   * @param {Object} obj - structure of the `Enum`
   * @param {Enum} subject - instance of `Enum`
   */
  static #simple(title, obj, subject) {
    // C langs enum
    const free = new Set();
    Object.defineProperty(subject, '[[metadata]]', { value: {} });
    Object.defineProperty(subject['[[metadata]]'], 'type', { value: Enum.simple });
    Object.defineProperty(subject['[[metadata]]'], 'title', { value: `${title}` });
    let e = 0;

    for (const key in obj) {
      Enum.check(key, subject, e);
      const tag = new String(key);
      let value;
      if (Number.isFinite(obj[key])) {
        value = obj[key];
        free.add(e);
      } else {
        value = e;
      }

      // smart sort enum constants to avoid duplicates and dead drops
      // sorts in-step with the loop
      if (subject[value] !== undefined) {
        if (subject[e] === undefined) {
          subject[e] = subject[value];
        } else {
          const ind = free.values().next().value;
          subject[ind] = subject[value];
          free.delete(ind);
        }
      }
      if (free.has(value)) {
        free.delete(value);
      }
      Object.defineProperty(subject, key, { value: tag });

      subject[value] = key; // {int: str, str: Str}
      e++;
    }
    Object.defineProperty(subject, 'size', { value: e });

    // additional loop to fix and freeze tags
    for (const key in subject) {
      const tag = subject[subject[key]];
      Object.defineProperty(tag, 'int', { value: +key });
      Object.freeze(tag);
    }

    return Object.freeze(subject);
  }

  /**
   * builds flags `Enum`
   * @param {string} title - name of the `Enum`
   * @param {Object} obj - structure of the `Enum`
   * @param {Enum} subject - instance of `Enum`
   */
  static #flags(title, obj, subject) {
    // bit keyed enum
    const keys = Object.keys(obj);
    const index = keys.indexOf('0');
    const shouldError = index > -1 ? keys.length > 33 : keys.length > 32;
    if (shouldError) {
      throw new RangeError(
        `Enum of bitmask type must be 32 >= keys long (excluding '0'): \x1B[7;33m${keys.length}\x1B[0m`
      );
    }
    if (index > -1) {
      keys.splice(index, 1);
    }

    Object.defineProperty(subject, '[[metadata]]', { value: {} });
    Object.defineProperty(subject['[[metadata]]'], 'type', { value: Enum.flags });
    Object.defineProperty(subject['[[metadata]]'], 'title', { value: `${title}` });
    Object.defineProperty(subject, 'size', { value: keys.length });

    // keys will be integers, 32 elements can be defined from 1 to -2147483648
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      Enum.check(key, subject, i);
      Object.defineProperty(subject, key, { value: 1 << i });
      subject[1 << i] = key;
    }

    // default value of 0
    if (0 in obj) {
      if (typeof obj[0] != `function`) {
        throw new TypeError(`Field 0 of enum ${title} must be a function`);
      }
      Object.defineProperty(subject, 0, {
        value: Object.freeze(obj[0].bind(subject))
      });
    } else {
      Object.defineProperty(subject, 0, {
        value: Object.freeze(() => {
          return undefined;
        })
      });
    }

    return Object.freeze(subject);
  }

  /**
   * builds flags `Enum`
   * @param {string} title - name of the `Enum`
   * @param {Object} obj - structure of the `Enum`
   * @param {Enum} subject - instance of `Enum`
   * @param {*} target - value of `new.target`
   */
  static #symbolic(title, obj, subject, target) {
    // rust enum, holds variants
    Object.defineProperty(subject, '[[metadata]]', { value: {} });
    Object.defineProperty(subject['[[metadata]]'], 'title', { value: `${title}` });
    Object.defineProperty(subject['[[metadata]]'], 'type', { value: Enum.symbolic });
    if (target.name === `EnumVariant`) {
      return subject;
    }

    const buildStructure = (field, key, target) => {
      if (typeof field == `object` && field != undefined) {
        return Enum.#factory(key, field, target);
      } else {
        return Enum.#factory(key, Enum.checkType(field, key), target);
      }
    };

    let i = 0;
    for (const key in obj) {
      Enum.check(key, subject, i);
      const variant = obj[key];
      Object.defineProperty(subject, key, {
        value: buildStructure(variant, key, subject),
        enumerable: true
      });
      i++;
    }

    return Object.freeze(subject);
  }

  /**
   * validates keys in Enum structure object
   * @param {string} key - key to check for conflict with existing property
   * @param {Enum} [obj] - enum instance on which the key is checked _(default empty `Enum`)_
   * @param {number} [e] - iteration _(default `0`)_
   * @param {boolean} [panic] - a switch to disable errors _(default `true`)_
   * @throws a `SyntaxError` or returns `false`
   */
  static check(key, obj = Enum.#baseline, e = 0, panic = true) {
    if (/^([a-z]|\_|\$){1}([a-z]|[0-9]|\_|\$)*$/i.test(key)) {
      if (key in obj) {
        if (panic) {
          throw new SyntaxError(
            `Enum key at [${e}] must not be a reserved property: \x1B[7;33m${key}\x1B[0m`
          );
        } else {
          return false;
        }
      }
    } else {
      if (panic) {
        throw new SyntaxError(
          `Enum key at [${e}] must follow varible naming syntax: \x1B[7;33m${key}\x1B[0m`
        );
      } else {
        return false;
      }
    }
    return true;
  }

  /**
   * helps decide the type of `EnumVariant` based on the first layer type annotations
   * @param {any} type - type annotation
   * @param {string} key - field from which the type was picked
   * @param {string} [substitute] - switch to replace invalid types with a 'str'
   * @param {Enum} [baseline] - base obejct to avoid confusion with inherited properties _(default empty `Enum`)_
   * @returns {string | symbol}
   */
  static checkType(type, key, substitute, baseline = Enum.#baseline) {
    if (type in Enum.types && !(type in baseline)) {
      return type;
    } else if (substitute === 'substitute') {
      return `str`;
    }
    return Symbol(key);
  }

  /**
   * makes closure constructors of `EnumVariant`, or a prebuilt instance
   * @param {Enum} parent - the enclosing `Enum`
   * @param {string} name - key of the `Enum` field
   * @param {Object | symbol | string} obj - value of the `Enum` field
   * @returns {Function | EnumVariant}
   */
  static #factory(name, obj, parent) {
    let schema;
    if (typeof obj != `object`) {
      if (typeof obj == `symbol`) {
        return new EnumVariant(name, { value: obj }, Enum.symbolic, schema, parent);
      } else {
        schema = { value: obj };
      }
    } else {
      schema = EnumVariant.buildSchema(obj, parent);
    }

    /**
     * builds instances of `EnumVariant`
     * @param {Object} object - source object, values will be transformed using {@link Enum.types}
     * @returns {EnumVariant}
     */
    const res = function builder(name, schema, object) {
      if (typeof object == `string`) {
        object = { value: object };
      }
      return new EnumVariant(name, object, Enum.symbolic, schema, this);
    }.bind(parent, name, schema);

    return Object.freeze(
      Object.defineProperties(res, {
        schema: {
          value: structuredClone(schema)
        },
        match: {
          set: function (callback) {
            if (typeof callback != `function`) {
              throw new SyntaxError(
                `Matcing expression for Enum variant ${this.name} must be a function`
              );
            }
            this.parent.#form[this.name] = callback;
          }.bind({ name, parent })
        }
      })
    );
  }

  /**
   * pattern matches with callbacks ready for any `EnumVariant`
   * @param {Object<string, Function>} form - object of callbacks
   * @param {EnumVariant} variant - any of the fields of the `Enum`
   * @returns {*} undefined or whatever the callback returns
   */
  static match(form, variant) {
    if (variant.constructor.name !== `EnumVariant`) {
      throw new TypeError(`Can only match EnumVariant instances`);
    }
    const misses = [];
    let answer;

    for (const key in variant['[[metadata]]'].parent) {
      if (!(key in form)) {
        misses.push(key);
        continue;
      }
      if (typeof form[key] != `function`) {
        throw new TypeError(`Expected form field "${key}" to be a funcion`);
      }
      if (key === variant['[[metadata]]'].title) {
        if ('value' in variant) {
          answer = form[key](variant.value);
        } else {
          answer = form[key](variant);
        }
      }
    }

    if (misses.length > 0) {
      throw new SyntaxError(
        `Matching form doesn't cover all variants of Enum, missing: ${misses}`
      );
    }
    return answer;
  }

  /**
   * looks for enum fields that are members of the bitmask
   * @param {number} mask - integer between 1 and -2147483648
   * @returns {string[]|undefined}
   */
  values(mask) {
    if (this['[[metadata]]'].type === Enum.symbolic) {
      throw new TypeError(`Cannot use bitmasking method .b() on symbolic enum`);
    }

    const flags = [];
    for (let i = 0, key = 1; i < 32; i++, key = 1 << i) {
      if ((mask | key) === mask && key in this) {
        flags.push(this[key]);
      }
    }
    Object.defineProperty(flags, 'print', {
      get: function () {
        return this.join(', ');
      }.bind(flags)
    });

    if (flags.length < 1) {
      return this[0](mask);
    }
    return flags;
  }

  /**
   * looks for enum fields that are members of the bitmask and gets their integers
   * @param {number} mask - integer between 1 and -2147483648
   * @returns {number[]|undefined}
   */
  keys(mask) {
    if (this['[[metadata]]'].type === Enum.symbolic) {
      throw new TypeError(`Cannot use bitmasking method .b() on symbolic enum`);
    }

    const flags = [];
    for (let i = 0, key = 1; i < 32; i++, key = 1 << i) {
      if ((mask | key) === mask && key in this) {
        flags.push(key);
      }
    }
    Object.defineProperty(flags, 'print', {
      get: function () {
        return this.join(', ');
      }.bind(flags)
    });

    if (flags.length < 1) {
      return this[0](mask);
    }
    return flags;
  }

  /**
   * looks for enum fields that are members of the bitmask and makes value:key pairs
   * @param {number} mask - integer between 1 and -2147483648
   * @returns {[string, number][]|undefined}
   */
  entries(mask) {
    if (this['[[metadata]]'].type === Enum.symbolic) {
      throw new TypeError(`Cannot use bitmasking method .b() on symbolic enum`);
    }

    const flags = [];
    for (let i = 0, key = 1; i < 32; i++, key = 1 << i) {
      if ((mask | key) === mask && key in this) {
        flags.push([this[key], key]);
      }
    }
    Object.defineProperty(flags, 'print', {
      get: function () {
        const string = Array.from(this);
        for (let i = 0; i < string.length; i++) {
          const [val, key] = string[i];
          string[i] = `${val}(${key})`;
        }
        return string.join(', ');
      }.bind(flags)
    });

    if (flags.length < 1) {
      return this[0](mask);
    }
    return flags;
  }

  #form = {};

  /**
   * @param {Object<string, Function>} form - object of callbacks for all `Enum` fields
   */
  #matchSetter(form) {
    if (this['[[metadata]]'].type !== Enum.symbolic) {
      throw new SyntaxError(`Can only set .match() binding on Enum.symbolic`);
    }
    const misses = [];

    for (const key in this) {
      if (!(key in form)) {
        misses.push(key);
        continue;
      }
      if (typeof form[key] != `function`) {
        throw new TypeError(`Expected matching expression for "${key}" to be a function`);
      }
    }

    if (misses.length > 0) {
      throw new SyntaxError(
        `Matching form doesn't cover all variants of Enum, missing: ${misses}`
      );
    }

    this.#form = functionalClone.call(this, form);
  }

  #matchGetter() {
    if (this['[[metadata]]'].type !== Enum.symbolic) {
      throw new SyntaxError(`Can only get .match() binding on Enum.symbolic`);
    }
    return Enum.match.bind(this, this.#form);
  }

  *[Symbol.iterator]() {
    for (const key in this) {
      yield this[key];
    }
  }
}

export class EnumVariant extends Enum {
  /**
   * @param {string} title - name of the `EnumVariant`
   * @param {Object} obj - input object with desired values
   * @param {symbol} opt - control tag to change the type of enum
   * @param {Object<string, string>} schema - object of type annotations {@link Enum.types}
   * @param {Enum} parent - the enclosing `Enum`
   */
  constructor(title, obj, opt, schema, parent) {
    super(title, obj, opt);
    Object.defineProperty(this['[[metadata]]'], 'parent', { value: parent });
    if (typeof obj?.value == `symbol`) {
      Object.assign(this, { value: obj.value });
      return Object.freeze(this);
    }

    Object.assign(this, EnumVariant.applySchema(obj, schema, title));
    return Object.freeze(this);
  }

  /**
   * creates a schema based on the input object
   * @param {Object<string, *>} obj - input object to define the structure of the schema
   * @param {Enum} parent - the enclosing `Enum`
   * @returns {Object<string, string>} a schema object with type annotations as strings
   */
  static buildSchema(obj, parent) {
    let layer = -1;
    const buildSchema = (subject) => {
      ++layer;
      if (subject instanceof Number || subject instanceof Boolean || subject == undefined) {
        return `str`;
      } else if (subject instanceof String) {
        return Enum.checkType(subject.toString(), '', 'substitute');
      }
      const newBlock = Array.isArray(subject) ? new Array(subject.length) : {};

      for (const key in subject) {
        if (!(subject instanceof Array)) {
          Enum.check(key, parent, `${layer} ${key}`);
        }
        let value = subject[key];
        if (typeof value == `object` && subject != undefined) {
          value = buildSchema(value);
        } else {
          value = Enum.checkType(value, key, 'substitute');
        }
        newBlock[key] = value;
      }

      return newBlock;
    };

    return buildSchema(obj);
  }

  /**
   * matches the input object to the schema and transforms values into defined types
   * @param {Object<string, *>} obj - input object with desired values
   * @param {Object<string, string>} schema - schema with type annotations
   * @returns {Object}
   */
  static applySchema(obj, schema, title) {
    let layer = -1;
    const applySchema = (subject, plan) => {
      ++layer;
      if (typeof plan == `string`) {
        return Object.freeze(Enum.types[plan](subject));
      }
      const newBlock = Array.isArray(subject) ? new Array(subject.length) : {};

      for (const key in plan) {
        if (!(key in subject)) {
          throw new SyntaxError(
            `EnumVariant "${title}" expected input object field named ${key} at layer ${layer}`
          );
        }
        let value = subject[key];
        const type = plan[key];
        if (typeof type == `object`) {
          if (typeof value != `object` || value == undefined) {
            throw new SyntaxError(
              `EnumVariant "${title}" expected input object field "${key}" to be an object: 
              ${JSON.stringify(type)}`
            );
          }
          value = applySchema(value, type);
        } else {
          value = Enum.types[type](value);
        }
        Object.defineProperty(newBlock, key, { value: value, enumerable: true });
      }

      return Object.freeze(newBlock);
    };

    return applySchema(obj, schema);
  }
}

function functionalClone(obj) {
  const res = {};
  for (const key in obj) {
    res[key] = obj[key].bind(this);
  }
  return res;
}

/* 
   Copyright (c) 2024 [Dan](https://github.com/DANser-freelancer) dans.channels.contact@gmail.com

   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

   1.  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

   2.  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

   3.  Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
