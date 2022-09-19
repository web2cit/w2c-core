# Web2Cit Core
Web2Cit is web metadata extraction system based on collaboratively defined
extraction procedures. 

This Web2Cit core library provides resources shared by all components in the
[Web2Cit](https://meta.wikimedia.org/wiki/Web2Cit) ecosystem.

> Note: If you just want to *use* Web2Cit, either to get collaboratively improved
citation metadata, or to help improve them, refer to our
[user guide](https://meta.wikimedia.org/wiki/Web2Cit/User_guide) instead.

If you want to understand how the different parts of the Web2Cit ecosystem
relate to one another, check our
[Web2Cit ecosystem video](https://meta.wikimedia.org/wiki/File:Web2cit_ecosystem.webm).

Web2Cit initial development is supported by a
[Wikimedia Foundation grant](https://meta.wikimedia.org/wiki/Grants:Project/Diegodlh/Web2Cit:_Visual_Editor_for_Citoid_Web_Translators).

## Installation
To use Web2Cit core library in your project, run:

```
npm install web2cit
```

## Usage
Briefly:
1. Begin by creating a `Domain` object for the domain you want Web2Cit to return
translation results for.
2. Use the `fetchAndLoadConfigs` instance method to fetch and load configuration
files from
[Web2Cit collaboratively repository in Meta](https://meta.wikimedia.org/wiki/Special:PrefixIndex/Web2Cit/data).
3. Use the `translate` instance method to get translation results for one or
more target paths.

See [`web2cit-server`](https://gitlab.wikimedia.org/diegodlh/w2c-server)
and [`web2cit-editor`](https://gitlab.wikimedia.org/diegodlh/w2c-editor)
for specific examples of how to use the Web2Cit core library.

## Development
This codebase relies on:
* TypeScript for type checking
* npm for module management
* Jest for automatic testing
* eslint for linting
* prettier for formatting

### Architecture
You can find an overview video of Web2Cit's core library architecture at
https://www.youtube.com/watch?v=Tw6jEiEACR0

#### Domain configuration objects
There is the `DomainConfiguration` abstract class, inherited by `PatternConfiguration`, `TemplateConfiguration` and `TestConfiguration` subclasses.

The objects of these classes are configured with a domain name and with storage configurations, and they "know" how to fetch the corresponding configurations from the storage, for which they have a series of methods.

In addition, domain configuration subclasses implement specific `parse` and `loadConfiguration` instance methods that "know" how to parse revision content into configuration values.

Configuration objects have a private `values` property holding an array of configuration values (templates, patterns or tests), either added manually, or loaded from a revision.

## License
This code is released under the GNU General Public License v3.