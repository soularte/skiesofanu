import { loadDataFile } from './data';
import type { AuthorsData } from './types';
const authors = loadDataFile<AuthorsData>('src/data/authors.md', {
  bio: [], ksenia: {name: 'Ксения Котова', photo: 'kk.jpg'}, vasily: {name: 'Василий Зеленков', photo: 'vz.jpg'},
});
export type AuthorKey = 'ksenia' | 'vasily';
export function schemaAuthors(origin: string, keys: AuthorKey[] = ['ksenia', 'vasily']) {
  return keys.map(key => ({'@type': 'Person', '@id': new URL(`/about/${key}/#person`, origin).href,
    name: authors[key].name, url: new URL(`/about/${key}/`, origin).href}));
}
