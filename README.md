# About

This here is a relatively small and simple model of what a javascript enum could be.
I guarantee that there are edge cases where everything breaks. Need help with testing in a real environment.

I don't write compiler code so I had to cobble together a system that would do the compilers job, out of available javascript mechanisms.  
This model is technically functional but ideally I would want to see most of the work and sugar syntax done by a runtime/typescript compiler.
I would honestly like to pitch this to the typescript team, however I have no idea how to do that.  
Contact me if you think this works much better than their enums, and I'll explain it in more detail.

I have borrowed some sensible design decisions from other languages, and I hope I got it right.  
The enums come in several flavors:

- **C# enum**, an object listing of named constants, each associated with a hidden integer value
  - usually the compiler would replace all references to enum fields with corresponding integers
- **C# `[Flags]` enum**, similar to C#, but in my model it forces the enum to have bit specific fields
- **Rust enum**, a symbolic enum
  - an enum that when declared acts as a namespace of predefined constructors
  - fields in this kind of enum can represent simple and complex values (like objects or integers) or act as unique constants
  - you can create new `EnumVariant` instances that will follow the structure defined in the enum field
  - comes with a pattern matching function
  - this flavor was the most painfully complicated one and probably has the most bugs

Also all `Enum` and `EnumVariant` instances _should be_ immutable

# Authors

- [Dan](https://github.com/DANser-freelancer): Code

### Documentation

- [Typescript implementation]()
- [JS runtime implementation]()
- [Use in raw form](https://github.com/DANser-freelancer/javascript-enum-model/blob/main/raw.md)
