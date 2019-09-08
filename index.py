#!/usr/bin/env python

import argparse
import fnmatch
import os
import sys
import urllib

#  Recursively generate index.html files for
#  all subdirectories in a directory tree

# Il faut que le scipt fasse 2 choses:
# générer un index: keyword -> liste de (nb, nom_fichier)
# générer un résumé: fichier -> resumé

index_file_name = os.path.join(os.getcwd(),'private/searchIndex.json')

def process_dir(top_dir, opts):
    index_file = open(os.path.join(unicode(top_dir), index_file_name), "w")

    for item in sorted(os.listdir(unicode(top_dir))):
        absolute_path = os.path.join(top_dir, item)
        if os.path.isdir(absolute_path):
            if not os.access(absolute_path, os.W_OK):
                print("***ERROR*** folder {} is not writable! SKIPPING!".format(absolute_path))
                continue

        if os.path.isfile(absolute_path):
            if opts.filter and not fnmatch.fnmatch(item, opts.filter):
                continue

            filename_escaped = item.encode('us-ascii', 'xmlcharrefreplace')
            filename_utf8 = item.encode('utf8')

            except Exception as e:
                print('ERROR writing file name:', e)
                print('filename_utf8:')
                repr(filename_utf8)
                print('filename_escaped:'),
                repr(filename_escaped)

    index_file.close()

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
                        default=os.path.join(os.getcwd(),'data'))

    config = parser.parse_args(sys.argv[1:])

process_dir(config.top_dir, config)
