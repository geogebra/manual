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

## Page format
The pages are written in AsciiDoc. We do not want to duplicate the [AsciiDoc documentation](https://docs.asciidoctor.org/asciidoc/latest/) here, just provide a few highlights:
* Rendering images in GitHub: to render image correctly both in GitHub and the docs site, each page has to contain `ifdef::env-github[:imagesdir: /**/modules/ROOT/assets/images]` where `**` should be replaced by your language code. This is included in all pages that were initially imported from Wiki.
* Using special characters in code blocks: to allow `((` and `{` in math blocks, please check [the passthrough macro](https://docs.asciidoctor.org/asciidoc/latest/pass/pass-macro/).

## Language links
To make sure your page is linked correctly to its counterparts in other languages, the `page-en` property has to be set. For example the [english page for Angle command](https://github.com/geogebra/manual/blob/main/en/modules/ROOT/pages/commands/Angle.adoc?plain=1) contains this just below the page's heading:
```asciidoc
:page-en: commands/Point
```
You can copy this line to your translation of the given English page and it will get linked to all existing translations.

## Publishing changes
Publishing changes takes some time, in general it should happen within 10 minutes from the moment your changes were merged into this repository.
For minor changes that do not need to be published immediatelly you can add `[ci skip]` to your commit message, then they will be processed in the next daily build around 5:40 AM GMT.
See the [list of recent deploymnents](https://github.com/geogebra/docs/actions/workflows/antora.yml) for details.

## Watching for changes
GitHub allows you to see the history of any part of this repository, e.g. for the English pages you can check
https://github.com/geogebra/manual/commits/main/en/modules/ROOT/pages
You can also watch the repository to be notified about changes.
