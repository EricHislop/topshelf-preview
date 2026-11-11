# Top Shelf Fragrances: demo storefront

A pitch demo for a fragrance decant shop. Hugo, hand written CSS, vanilla JS cart.
No backend, no payment provider, no accounts.

## Run it

```bash
hugo server -D            # local, http://localhost:1313
hugo --minify --gc        # build to public/
```

Local test builds should use a local base URL:

```bash
hugo --minify --baseURL http://localhost:8902/
```

## Images

Generated locally with SDXL through ComfyUI (`scripts/gen_images.py`), because the
managed image API had no balance. Source PNGs live in `assets/img/` and are gitignored;
run `scripts/convert.py` to produce the webp files in `static/img/` plus the share card.

To regenerate a single shot, edit `JOBS` in the script and delete the matching PNG.

## What is real and what is not

Real: the layout, the cart, the size logic, the checkout validation, the copy.
Not real: the prices (placeholders), the fragrance names (invented), the photography
(generated), the payment step (there isn't one), and the order confirmation.

## Deploy

```bash
hugo --minify --gc --baseURL https://erichislop.github.io/sillage-preview/
rsync -a --delete public/ ../.deploy-sillage/
cd ../.deploy-sillage && git add -A && git commit -m "deploy" && git push -f origin gh-pages
```
