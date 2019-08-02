#!/usr/bin/env python

import argparse
import fnmatch
import os
import sys

index_file_name = 'index.html'

def create_link(link_name, link_value):
    if not link_name:
        link_name = link_value
    index_file = open(link_name, "w")
    index_file.write('''<!DOCTYPE html>
    <html>
       <body>
          <script type="text/javascript">
            window.location.href = "{link_val}";
          </script>
       </body>
    </html>'''.format(
            link_val=link_value.encode('utf8')))

    index_file.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='''DESCRIPTION:
    Generate directory index files recursively.
    Start from current dir or from folder passed as first positional argument.
    Optionally filter by file types with --filter "*.py". ''')

    parser.add_argument('link_value',
                        nargs='?',
                        action='store',
                        help='top folder from which to start generating indexes, '
                             'use current folder if not specified')

    parser.add_argument('link_name',
                        nargs='?',
                        action='store',
                        help='top folder from which to start generating indexes, '
                             'use current folder if not specified')

    config = parser.parse_args(sys.argv[1:])


create_link(config.link_name, config.link_value)
