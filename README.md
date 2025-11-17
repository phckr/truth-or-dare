# Truth or Dare

This is a simple static website that allows a heterosexual couple to play Truth or Dare with 
precanned questions and dares. I would imagine that this could be enhanced for other types of couples.

It is designed to work best on a tablet or phone and is touch enabled. 

There is a single file, [`tod-data.json`](./tod-data.json), which contains all the questions and dares. The [`tod.js`](./tod.js) 
contains all the logic. This does use a service worker to cache the entire website so that it will run offline.

iI'm sure that this could be prettied up and maybe there could be customization of question sets. Please
open Pull requests.
