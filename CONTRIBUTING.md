# Contributor Guide
Thanks for your interest in contributing to GeoGebra Manual!
In this document we'll focus on editing the manual using GitHub's online editor.
You can also make a local copy of this repository, make the changes locally on your computer, and then push them to GitHub.


## How to edit a page
The easiest way is to follow the "Edit this page" link from the page you want to edit.
You can also browse this GitHub repository to find the page and use the Edit button.
In case you are a new contributor, both of these options will ask you to create a fork of the repository.
Once the repository is forked, you can use the online editor to make your changes.
For help with the syntax, please see [AsciiDoc documentation](https://docs.asciidoctor.org/asciidoc/latest/).
Once you're done with your changes, you can commit them to your forked repository.
GitHub will also suggest to create a pull request for your changes, please do so.
One of the maintainers will verify your pull request and if it provides an improvement, the pull request will be merged (so your changes will become part of the manual).

## Language links
To make sure your page is linked correctly to its counterparts in other languages, the `page-en` property has to be set. For example the [english page for Angle command](https://github.com/geogebra/manual/blob/main/en/modules/ROOT/pages/commands/Angle.adoc?plain=1) contains this just below the page's heading:
```asciidoc
:page-en:commands/Point
```
You can copy this line to your translation of the given English page and it will get linked to all existing translations.

## Watching for changes
GitHub allows you to see the history of any part of this repository, e.g. for the English pages you can check
https://github.com/geogebra/manual/commits/main/en/modules/ROOT/pages
You can also watch the repository to be notified about changes.
