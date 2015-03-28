# meta-matter

[![Build Status](https://travis-ci.org/jakwings/meta-matter.svg)](https://travis-ci.org/jakwings/meta-matter)
[![NPM version](https://badge.fury.io/js/meta-matter.svg)](http://badge.fury.io/js/meta-matter)

A customizable extractor for front matter in various formats (YAML, TOML, etc.) between a pair of delimiters and at the start of a string.

Features:

*   Delimiters are customizable. (a language name can be placed next to the first delimiter)
*   Parsers are customizable. (with builtin YAML and TOML parsers)
*   LF (0x0A) and CRLF (\x0D\x0A) are both recognizable newlines.


## Installation

```bash
npm install meta-matter
```


## Usage

```javascript
var matter = require('meta-matter');

matter('---\nfoo: bar\n---\nbaz');
/* return {
  src: "---\nfoo: bar\n---\nbaz",
  body: "baz",
  data: {foo: "bar"}
}
*/

matter.readFileSync('example.md', {delims: ['--[', ']--']});

/* example.md:

--[ TOML
foo = "bar"
]--
baz
*/
```


## Methods

### matter(string[, options])

Parse a string with or without front matter and return an object.

Options:

*   `options.loose {Boolean?}`: Whether to tolerate ambiguous delimiters. Default: `false`
*   `options.lang {String?}`: The name of the parser to use if `options.parsers` is not a function. Default: 'yaml'
*   `options.delims {(String|Array)?}`: Custom delimiters. Default: `'---'` or `['---', '---']`
*   `options.parsers {(Function|Object)?}`: Custom parser(s). Default: `{'yaml': matter.parsers.yaml,'toml': matter.parsers.toml}`
    * `{function(text, {loose: Boolean}): Mixed}` A parser function. `options.lang` will be ignored.
    * `{Object.<String, Function>}`: A map from languages to parser functions.

The returned object has three properties:

*   `src {String}`: The original input string.
*   `body {String}`: The input string without front matter.
*   `data {Mixed}`: The data returned from the parsers. Default: `null`

A language name (case-insensitive, lower-case preferred) can be appended to the first delimiter in the source text, e.g. `--- YAML`, and it will override `options.lang` but not `options.parsers`. All builtin languages are "yaml" and "toml".

### matter.test(string[, options])

Check if a string contains front matter. Only `options.loose` and `options.delims` are useful options.

### matter.readFile(path[, options], callback)

Read and parse a file asynchronously. The callback function is of type `function(error, object)`.

The returned object will have one more property "path" for the real file path.

### matter.readFileSync(path[, options])

Read and parse the file synchronously. It may throw an error when the file is not readable.

The returned object will have one more property "path" for the real file path.


## Other properties of matter.

### matter.modules

An object with the cache of required modules (lazily loaded):

*   `{Object} matter.modules.yaml: require('js-yaml')`
*   `{Object} matter.modules.toml: require('toml')`

### matter.parsers

All builtin parsers (allowed to be modified):

*   `{function(str, opts): Mixed} matter.parsers.yaml`: The YAML parser.
*   `{function(str, opts): Mixed} matter.parsers.toml`: The TOML parser.

All builtin parsers will return `null` when an error occurs.


## License

Copyright (c) 2015 Jak Wings. This project was released under the MIT license.
