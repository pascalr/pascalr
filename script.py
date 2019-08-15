#!/usr/bin/env python

import argparse
import fnmatch
import os
import sys
import urllib

#  Recursively generate index.html files for
#  all subdirectories in a directory tree

index_file_name = 'index.html'

def process_dir(top_dir, opts):
    for parentdir, dirs, files in os.walk(unicode(top_dir)):

        if not opts.dryrun:
            index_file = open(os.path.join(parentdir, index_file_name), "w")
            index_file.write('''<!DOCTYPE html>
    <html>
     <head>
       <link rel="stylesheet" type="text/css" href="style.css">
       <meta charset="utf-8"/>
     </head>
     <body>
      <script src="jquery.min.js"></script>
      <script src="./main.js"></script>
      <div id="sideMenu">
        <img src="headphone.png" alt="Music" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
        <img src="accords.jpg" alt="Accords" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
        <img src="guitar.png" alt="Guitar" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
        <img src="film.png" alt="Film" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
        <img src="udes.png" alt="Udes" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
        <img src="cauldron.png" alt="Cooking" width="128" height="128" onClick="toggleSelected(this)" class="filterTag">
      </div>
      <div id="filterValDiv"><input id="filterVal" type="text" onchange="filter()" autofocus></div>
      <div class="content">
       <h1>{curr_dir}</h1>
       <li><a style="display:block; width:100%" href="..">&#x21B0;</a></li>'''.format(
                curr_dir=os.path.basename(os.path.abspath(parentdir).encode('utf8'))
            )
            )

        for dirname in sorted(dirs):

            absolute_dir_path = os.path.join(parentdir, dirname)

            if not os.access(absolute_dir_path, os.W_OK):
                print("***ERROR*** folder {} is not writable! SKIPPING!".format(absolute_dir_path))
                continue
            if opts.verbose:
                print('DIR:{}'.format(absolute_dir_path))

            if not opts.dryrun:
                index_file.write("""
       <li><a style="display:block; width:100%" href="{link}">&#128193; {link_text}</a></li>""".format(
                    link=dirname.encode('utf8'),
                    link_text=dirname.encode('us-ascii', 'xmlcharrefreplace')))

        for filename in sorted(files):

            if opts.filter and not fnmatch.fnmatch(filename, opts.filter):
                if opts.verbose:
                    print('SKIP: {}/{}'.format(parentdir, filename))
                continue

            if opts.verbose:
                print('{}/{}'.format(parentdir, filename))
            filename_escaped = filename.encode('us-ascii', 'xmlcharrefreplace')
            filename_utf8 = filename.encode('utf8')

            if filename.strip().lower() == index_file_name.lower():
                continue

            try:
                size = int(os.path.getsize(os.path.join(parentdir, filename)))

                if not opts.dryrun:
                    index_file.write(
    """
       <li>&#x1f4c4; <a href="{link}">{link_text}</a><span class="size">{size}</span></li>""".format(
                                link=urllib.quote(filename_utf8),
                                link_text=filename_escaped,
                                size=pretty_size(size))
                    )

            except Exception as e:
                print('ERROR writing file name:', e)
                print('filename_utf8:')
                repr(filename_utf8)
                print('filename_escaped:'),
                repr(filename_escaped)

        if not opts.dryrun:
            index_file.write("""
  </div>
 </body>
</html>""")
            index_file.close()


# bytes pretty-printing
UNITS_MAPPING = [
    (1024 ** 5, ' PB'),
    (1024 ** 4, ' TB'),
    (1024 ** 3, ' GB'),
    (1024 ** 2, ' MB'),
    (1024 ** 1, ' KB'),
    (1024 ** 0, (' byte', ' bytes')),
]


def pretty_size(bytes, units=UNITS_MAPPING):
    """Human-readable file sizes.
    ripped from https://pypi.python.org/pypi/hurry.filesize/
    """
    for factor, suffix in units:
        if bytes >= factor:
            break
    amount = int(bytes / factor)

    if isinstance(suffix, tuple):
        singular, multiple = suffix
        if amount == 1:
            suffix = singular
        else:
            suffix = multiple
    return str(amount) + suffix

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='''DESCRIPTION:
    Generate directory index files recursively.
    Start from current dir or from folder passed as first positional argument.
    Optionally filter by file types with --filter "*.py". ''')

    parser.add_argument('top_dir',
                        nargs='?',
                        action='store',
                        help='top folder from which to start generating indexes, '
                             'use current folder if not specified',
                        default=os.getcwd())

    parser.add_argument('--filter', '-f',
                        help='only include files matching glob',
                        required=False)

    parser.add_argument('--verbose', '-v',
                        action='store_true',
                        help='***WARNING: this can take a very long time with complex file tree structures***'
                             ' verbosely list every processed file',
                        required=False)

    parser.add_argument('--dryrun', '-d',
                        action='store_true',
                        help="don't write any files, just simulate the traversal",
                        required=False)

    config = parser.parse_args(sys.argv[1:])


process_dir(config.top_dir, config)
