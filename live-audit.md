# Live Audit

Generated: 2026-04-28T07:22:05.091Z
Base URL: http://localhost:3000
Recipe sample seed: 2026-04-28T07:19:51.461Z

## Coverage

- Static/reference pages: 9
- Random recipe pages: 30
- Cooking section pages: 9
- Region pages: 36

## Summary

| Metric | Count |
| --- | --- |
| Pages visited | 84 |
| Pages with issues | 24 |
| Total issues | 58 |
| Visual checks passed | 6 |
| Visual checks failed | 0 |

## Random Recipe Sample

| id | name |
| --- | --- |
| jhinga-dopyaza | Jhinga Dopyaza |
| khandavi | Khandavi |
| khoya | Khoya |
| mahi-kaliya | Mahi Kaliya |
| dahi-ki-machhali | Dahi ki Machhali |
| neyappam | Neyappam |
| masala-idli | Masala Idli |
| bharwan-guchhi | Bharwan Guchhi |
| meen-biryani | Meen Biryani |
| baghare-gajar | Baghare Gajar |
| seb-ka-ras | Seb ka Ras |
| chaamp-chops | Chaamp Chops |
| lauki-ke-kofte-2 | Lauki ke Kofte |
| gosht-ki-khurchan | Gosht ki Khurchan |
| paper-dosa | Paper Dosa |
| uralaikizhan-sagu | Uralaikizhan Sagu |
| podi-sambhar | Podi Sambhar |
| dum-ki-machhali | Dum ki Machhali |
| voksa | Voksa |
| vazhaippazham-chips | Vazhaippazham Chips |
| paneer-makhani | Paneer Makhani |
| kamala-phoolkopi-2 | Kamala Phoolkopi |
| vatticha-mathi-kari | Vatticha Mathi Kari |
| jhingri-machher-malikari | Jhingri Machher Malikari |
| shai-dum-ki-machhali | Shai Dum ki Machhali |
| gushtaba | Gushtaba |
| dakshini-hari-chutney | Dakshini Hari Chutney |
| makki-ka-soweta | Makki ka Soweta |
| matthi | Matthi |
| paneer-pasanda | Paneer Pasanda |

## Visual Fix Verification

### Hero image scroll reveal on a recipe page

Status: passed

Initial hero height 924px / viewport 1000px; content top after scroll 133px.

Screenshots:
- /tmp/qa-screenshots/visual-recipe-hero-load.jpg (repo: `qa-screenshots/visual-recipe-hero-load.jpg`)
- /tmp/qa-screenshots/visual-recipe-hero-scrolled.jpg (repo: `qa-screenshots/visual-recipe-hero-scrolled.jpg`)

### Chapters and Regions are separate top-level pages

Status: passed

/chapters matched the expected page structure.

Screenshots:
- /tmp/qa-screenshots/visual-chapters-page.jpg (repo: `qa-screenshots/visual-chapters-page.jpg`)

### Regions top-level page renders independently

Status: passed

/regions matched the expected page structure.

Screenshots:
- /tmp/qa-screenshots/visual-regions-page.jpg (repo: `qa-screenshots/visual-regions-page.jpg`)

### Introduction page renders prose without filter UI

Status: passed

/introduction matched the expected page structure.

Screenshots:
- /tmp/qa-screenshots/visual-introduction-page.jpg (repo: `qa-screenshots/visual-introduction-page.jpg`)

### Glossary page shows alphabetical English and regional columns

Status: passed

/glossary matched the expected page structure.

Screenshots:
- /tmp/qa-screenshots/visual-glossary-page.jpg (repo: `qa-screenshots/visual-glossary-page.jpg`)

### About page does not show an Ayurveda section

Status: passed

/about matched the expected page structure.

Screenshots:
- /tmp/qa-screenshots/visual-about-page.jpg (repo: `qa-screenshots/visual-about-page.jpg`)

## Issues By Page

### Home (/)

Screenshot: /tmp/qa-screenshots/001-static-home.jpg (repo: `qa-screenshots/001-static-home.jpg`)

Document status: 200

_No issues captured._

### Chapters (/chapters)

Screenshot: /tmp/qa-screenshots/002-static-chapters.jpg (repo: `qa-screenshots/002-static-chapters.jpg`)

Document status: 200

_No issues captured._

### Regions (/regions)

Screenshot: /tmp/qa-screenshots/003-static-regions.jpg (repo: `qa-screenshots/003-static-regions.jpg`)

Document status: 200

- **request failed:** https://gujarattourism.com/content/dam/gujrattourism/images/heritage-sites/rani-ki-vav/Rani-Ki-Vav-Banner.jpg (net::ERR_BLOCKED_BY_ORB)
- **request failed:** https://gujarattourism.com/content/dam/gujrattourism/images/religious-sites/udvada-parsi,-udvada/gallery/Udvada%20Parsi%20Udvada21.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://gujarattourism.com/content/dam/gujrattourism/images/heritage-sites/rani-ki-vav/Rani-Ki-Vav-Banner.jpg (alt: Gujarat)
- **image failed:** https://gujarattourism.com/content/dam/gujrattourism/images/religious-sites/udvada-parsi,-udvada/gallery/Udvada%20Parsi%20Udvada21.jpg (alt: Parsi)

### About (/about)

Screenshot: /tmp/qa-screenshots/004-static-about.jpg (repo: `qa-screenshots/004-static-about.jpg`)

Document status: 200

_No issues captured._

### Introduction (/introduction)

Screenshot: /tmp/qa-screenshots/005-static-introduction.jpg (repo: `qa-screenshots/005-static-introduction.jpg`)

Document status: 200

_No issues captured._

### Glossary (/glossary)

Screenshot: /tmp/qa-screenshots/006-static-glossary.jpg (repo: `qa-screenshots/006-static-glossary.jpg`)

Document status: 200

_No issues captured._

### Directory (/directory)

Screenshot: /tmp/qa-screenshots/007-static-directory.jpg (repo: `qa-screenshots/007-static-directory.jpg`)

Document status: 200

_No issues captured._

### Index (/index)

Screenshot: /tmp/qa-screenshots/008-static-index.jpg (repo: `qa-screenshots/008-static-index.jpg`)

Document status: 200

_No issues captured._

### Search (/search)

Screenshot: /tmp/qa-screenshots/009-static-search.jpg (repo: `qa-screenshots/009-static-search.jpg`)

Document status: 200

_No issues captured._

### Jhinga Dopyaza (/recipes/jhinga-dopyaza)

Screenshot: /tmp/qa-screenshots/010-recipe-jhinga-dopyaza.jpg (repo: `qa-screenshots/010-recipe-jhinga-dopyaza.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Khandavi (/recipes/khandavi)

Screenshot: /tmp/qa-screenshots/011-recipe-khandavi.jpg (repo: `qa-screenshots/011-recipe-khandavi.jpg`)

Document status: 200

_No issues captured._

### Khoya (/recipes/khoya)

Screenshot: /tmp/qa-screenshots/012-recipe-khoya.jpg (repo: `qa-screenshots/012-recipe-khoya.jpg`)

Document status: 200

_No issues captured._

### Mahi Kaliya (/recipes/mahi-kaliya)

Screenshot: /tmp/qa-screenshots/013-recipe-mahi-kaliya.jpg (repo: `qa-screenshots/013-recipe-mahi-kaliya.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Dahi ki Machhali (/recipes/dahi-ki-machhali)

Screenshot: /tmp/qa-screenshots/014-recipe-dahi-ki-machhali.jpg (repo: `qa-screenshots/014-recipe-dahi-ki-machhali.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Neyappam (/recipes/neyappam)

Screenshot: /tmp/qa-screenshots/015-recipe-neyappam.jpg (repo: `qa-screenshots/015-recipe-neyappam.jpg`)

Document status: 200

_No issues captured._

### Masala Idli (/recipes/masala-idli)

Screenshot: /tmp/qa-screenshots/016-recipe-masala-idli.jpg (repo: `qa-screenshots/016-recipe-masala-idli.jpg`)

Document status: 200

_No issues captured._

### Bharwan Guchhi (/recipes/bharwan-guchhi)

Screenshot: /tmp/qa-screenshots/017-recipe-bharwan-guchhi.jpg (repo: `qa-screenshots/017-recipe-bharwan-guchhi.jpg`)

Document status: 200

_No issues captured._

### Meen Biryani (/recipes/meen-biryani)

Screenshot: /tmp/qa-screenshots/018-recipe-meen-biryani.jpg (repo: `qa-screenshots/018-recipe-meen-biryani.jpg`)

Document status: 200

_No issues captured._

### Baghare Gajar (/recipes/baghare-gajar)

Screenshot: /tmp/qa-screenshots/019-recipe-baghare-gajar.jpg (repo: `qa-screenshots/019-recipe-baghare-gajar.jpg`)

Document status: 200

_No issues captured._

### Seb ka Ras (/recipes/seb-ka-ras)

Screenshot: /tmp/qa-screenshots/020-recipe-seb-ka-ras.jpg (repo: `qa-screenshots/020-recipe-seb-ka-ras.jpg`)

Document status: 200

_No issues captured._

### Chaamp Chops (/recipes/chaamp-chops)

Screenshot: /tmp/qa-screenshots/021-recipe-chaamp-chops.jpg (repo: `qa-screenshots/021-recipe-chaamp-chops.jpg`)

Document status: 200

_No issues captured._

### Lauki ke Kofte (/recipes/lauki-ke-kofte-2)

Screenshot: /tmp/qa-screenshots/022-recipe-lauki-ke-kofte.jpg (repo: `qa-screenshots/022-recipe-lauki-ke-kofte.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Gosht ki Khurchan (/recipes/gosht-ki-khurchan)

Screenshot: /tmp/qa-screenshots/023-recipe-gosht-ki-khurchan.jpg (repo: `qa-screenshots/023-recipe-gosht-ki-khurchan.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Paper Dosa (/recipes/paper-dosa)

Screenshot: /tmp/qa-screenshots/024-recipe-paper-dosa.jpg (repo: `qa-screenshots/024-recipe-paper-dosa.jpg`)

Document status: 200

_No issues captured._

### Uralaikizhan Sagu (/recipes/uralaikizhan-sagu)

Screenshot: /tmp/qa-screenshots/025-recipe-uralaikizhan-sagu.jpg (repo: `qa-screenshots/025-recipe-uralaikizhan-sagu.jpg`)

Document status: 200

_No issues captured._

### Podi Sambhar (/recipes/podi-sambhar)

Screenshot: /tmp/qa-screenshots/026-recipe-podi-sambhar.jpg (repo: `qa-screenshots/026-recipe-podi-sambhar.jpg`)

Document status: 200

_No issues captured._

### Dum ki Machhali (/recipes/dum-ki-machhali)

Screenshot: /tmp/qa-screenshots/027-recipe-dum-ki-machhali.jpg (repo: `qa-screenshots/027-recipe-dum-ki-machhali.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Voksa (/recipes/voksa)

Screenshot: /tmp/qa-screenshots/028-recipe-voksa.jpg (repo: `qa-screenshots/028-recipe-voksa.jpg`)

Document status: 200

_No issues captured._

### Vazhaippazham Chips (/recipes/vazhaippazham-chips)

Screenshot: /tmp/qa-screenshots/029-recipe-vazhaippazham-chips.jpg (repo: `qa-screenshots/029-recipe-vazhaippazham-chips.jpg`)

Document status: 200

_No issues captured._

### Paneer Makhani (/recipes/paneer-makhani)

Screenshot: /tmp/qa-screenshots/030-recipe-paneer-makhani.jpg (repo: `qa-screenshots/030-recipe-paneer-makhani.jpg`)

Document status: 200

_No issues captured._

### Kamala Phoolkopi (/recipes/kamala-phoolkopi-2)

Screenshot: /tmp/qa-screenshots/031-recipe-kamala-phoolkopi.jpg (repo: `qa-screenshots/031-recipe-kamala-phoolkopi.jpg`)

Document status: 200

- **request failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (alt: Singhara)

### Vatticha Mathi Kari (/recipes/vatticha-mathi-kari)

Screenshot: /tmp/qa-screenshots/032-recipe-vatticha-mathi-kari.jpg (repo: `qa-screenshots/032-recipe-vatticha-mathi-kari.jpg`)

Document status: 200

_No issues captured._

### Jhingri Machher Malikari (/recipes/jhingri-machher-malikari)

Screenshot: /tmp/qa-screenshots/033-recipe-jhingri-machher-malikari.jpg (repo: `qa-screenshots/033-recipe-jhingri-machher-malikari.jpg`)

Document status: 200

- **request failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (alt: Singhara)

### Shai Dum ki Machhali (/recipes/shai-dum-ki-machhali)

Screenshot: /tmp/qa-screenshots/034-recipe-shai-dum-ki-machhali.jpg (repo: `qa-screenshots/034-recipe-shai-dum-ki-machhali.jpg`)

Document status: 200

_No issues captured._

### Gushtaba (/recipes/gushtaba)

Screenshot: /tmp/qa-screenshots/035-recipe-gushtaba.jpg (repo: `qa-screenshots/035-recipe-gushtaba.jpg`)

Document status: 200

_No issues captured._

### Dakshini Hari Chutney (/recipes/dakshini-hari-chutney)

Screenshot: /tmp/qa-screenshots/036-recipe-dakshini-hari-chutney.jpg (repo: `qa-screenshots/036-recipe-dakshini-hari-chutney.jpg`)

Document status: 200

_No issues captured._

### Makki ka Soweta (/recipes/makki-ka-soweta)

Screenshot: /tmp/qa-screenshots/037-recipe-makki-ka-soweta.jpg (repo: `qa-screenshots/037-recipe-makki-ka-soweta.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2019/02/mirchi-bada-recipe-mirchi-vada-how-to-make-rajasthani-mirchi-bada-1.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2019/02/mirchi-bada-recipe-mirchi-vada-how-to-make-rajasthani-mirchi-bada-1.jpeg (alt: Mirchi Vada)

### Matthi (/recipes/matthi)

Screenshot: /tmp/qa-screenshots/038-recipe-matthi.jpg (repo: `qa-screenshots/038-recipe-matthi.jpg`)

Document status: 200

_No issues captured._

### Paneer Pasanda (/recipes/paneer-pasanda)

Screenshot: /tmp/qa-screenshots/039-recipe-paneer-pasanda.jpg (repo: `qa-screenshots/039-recipe-paneer-pasanda.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Spice Mixtures and Pastes (/sections/spice-mixtures-and-pastes)

Screenshot: /tmp/qa-screenshots/040-section-spice-mixtures-and-pastes.jpg (repo: `qa-screenshots/040-section-spice-mixtures-and-pastes.jpg`)

Document status: 200

_No issues captured._

### Pickles, Chutneys and Raitas (/sections/pickles-chutneys-and-raitas)

Screenshot: /tmp/qa-screenshots/041-section-pickles-chutneys-and-raitas.jpg (repo: `qa-screenshots/041-section-pickles-chutneys-and-raitas.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Snacks and Appetizers (/sections/snacks-and-appetizers)

Screenshot: /tmp/qa-screenshots/042-section-snacks-and-appetizers.jpg (repo: `qa-screenshots/042-section-snacks-and-appetizers.jpg`)

Document status: 200

_No issues captured._

### Main Dishes (/sections/main-dishes)

Screenshot: /tmp/qa-screenshots/043-section-main-dishes.jpg (repo: `qa-screenshots/043-section-main-dishes.jpg`)

Document status: 200

_No issues captured._

### Pulses (/sections/pulses)

Screenshot: /tmp/qa-screenshots/044-section-pulses.jpg (repo: `qa-screenshots/044-section-pulses.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2019/09/onion-sambar-recipe-vengaya-sambar-ulli-sambar-small-onion-sambar-1.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2019/09/onion-sambar-recipe-vengaya-sambar-ulli-sambar-small-onion-sambar-1.jpeg (alt: Thenga Chertha Ulli Sambhar)

### Breads (/sections/breads)

Screenshot: /tmp/qa-screenshots/045-section-breads.jpg (repo: `qa-screenshots/045-section-breads.jpg`)

Document status: 200

_No issues captured._

### Rice (/sections/rice)

Screenshot: /tmp/qa-screenshots/046-section-rice.jpg (repo: `qa-screenshots/046-section-rice.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2024/08/Mushroom-Pulao-Recipe-Authentic-Flavored-Mushroom-Rice-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2024/08/Mushroom-Pulao-Recipe-Authentic-Flavored-Mushroom-Rice-1-scaled.jpeg (alt: Kurmu Pulao)

### Desserts (/sections/desserts)

Screenshot: /tmp/qa-screenshots/047-section-desserts.jpg (repo: `qa-screenshots/047-section-desserts.jpg`)

Document status: 200

_No issues captured._

### Drinks (/sections/drinks)

Screenshot: /tmp/qa-screenshots/048-section-drinks.jpg (repo: `qa-screenshots/048-section-drinks.jpg`)

Document status: 200

_No issues captured._

### Andhra Pradesh (/regions/andhra-pradesh)

Screenshot: /tmp/qa-screenshots/049-region-andhra-pradesh.jpg (repo: `qa-screenshots/049-region-andhra-pradesh.jpg`)

Document status: 200

_No issues captured._

### Anglo-Indian (/regions/anglo-indian)

Screenshot: /tmp/qa-screenshots/050-region-anglo-indian.jpg (repo: `qa-screenshots/050-region-anglo-indian.jpg`)

Document status: 200

_No issues captured._

### Awadh (/regions/awadh)

Screenshot: /tmp/qa-screenshots/051-region-awadh.jpg (repo: `qa-screenshots/051-region-awadh.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2020/09/dahi-ki-chatni-recipe-dahi-chutney-recipe-dahi-lahsun-ki-chutney-1-scaled.jpeg (alt: Dahi ki Chutney)

### Bengal (/regions/bengal)

Screenshot: /tmp/qa-screenshots/052-region-bengal.jpg (repo: `qa-screenshots/052-region-bengal.jpg`)

Document status: 200

_No issues captured._

### Coastal (/regions/coastal)

Screenshot: /tmp/qa-screenshots/053-region-coastal.jpg (repo: `qa-screenshots/053-region-coastal.jpg`)

Document status: 200

- **request failed:** https://www.teaforturmeric.com/wp-content/uploads/2023/06/Fish-Curry-Recipe.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://www.teaforturmeric.com/wp-content/uploads/2023/06/Fish-Curry-Recipe.jpg (alt: Lal Machhali)

### Delhi (/regions/delhi)

Screenshot: /tmp/qa-screenshots/054-region-delhi.jpg (repo: `qa-screenshots/054-region-delhi.jpg`)

Document status: 200

_No issues captured._

### Delhi/Agra (/regions/delhi-agra)

Screenshot: /tmp/qa-screenshots/055-region-delhi-agra.jpg (repo: `qa-screenshots/055-region-delhi-agra.jpg`)

Document status: 200

_No issues captured._

### Delhi/Bhopal (/regions/delhi-bhopal)

Screenshot: /tmp/qa-screenshots/056-region-delhi-bhopal.jpg (repo: `qa-screenshots/056-region-delhi-bhopal.jpg`)

Document status: 200

_No issues captured._

### Delhi/Punjab/Awadh (/regions/delhi-punjab-awadh)

Screenshot: /tmp/qa-screenshots/057-region-delhi-punjab-awadh.jpg (repo: `qa-screenshots/057-region-delhi-punjab-awadh.jpg`)

Document status: 200

_No issues captured._

### Goa (/regions/goa)

Screenshot: /tmp/qa-screenshots/058-region-goa.jpg (repo: `qa-screenshots/058-region-goa.jpg`)

Document status: 200

_No issues captured._

### Gujarat (/regions/gujarat)

Screenshot: /tmp/qa-screenshots/059-region-gujarat.jpg (repo: `qa-screenshots/059-region-gujarat.jpg`)

Document status: 200

- **request failed:** https://gujarattourism.com/content/dam/gujrattourism/images/heritage-sites/rani-ki-vav/Rani-Ki-Vav-Banner.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://gujarattourism.com/content/dam/gujrattourism/images/heritage-sites/rani-ki-vav/Rani-Ki-Vav-Banner.jpg (alt: Gujarat)

### Hyderabad (/regions/hyderabad)

Screenshot: /tmp/qa-screenshots/060-region-hyderabad.jpg (repo: `qa-screenshots/060-region-hyderabad.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2019/08/gutti-vankaya-curry-recipe-stuffed-brinjal-curry-gutti-vankaya-kura-2.jpeg (net::ERR_BLOCKED_BY_ORB)
- **request failed:** https://indianambrosia.com/wp-content/uploads/2018/04/bagara-baingan_3881.jpg (net::ERR_BLOCKED_BY_ORB)
- **request failed:** https://asaanrecipes.com/wp-content/uploads/2020/09/kachche-keema-ke-kabab-tikki-ffVSFb2bnoA-1.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://asaanrecipes.com/wp-content/uploads/2020/09/kachche-keema-ke-kabab-tikki-ffVSFb2bnoA-1.jpg (alt: Kachhe Keeme ki Tikya)
- **image failed:** https://indianambrosia.com/wp-content/uploads/2018/04/bagara-baingan_3881.jpg (alt: Baghare Baigan)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2019/08/gutti-vankaya-curry-recipe-stuffed-brinjal-curry-gutti-vankaya-kura-2.jpeg (alt: Gutti Vengkayya)

### Hyderabad/Andhra Pradesh (/regions/hyderabad-andhra-pradesh)

Screenshot: /tmp/qa-screenshots/061-region-hyderabad-andhra-pradesh.jpg (repo: `qa-screenshots/061-region-hyderabad-andhra-pradesh.jpg`)

Document status: 200

_No issues captured._

### Jammu and Kashmir (/regions/jammu-and-kashmir)

Screenshot: /tmp/qa-screenshots/062-region-jammu-and-kashmir.jpg (repo: `qa-screenshots/062-region-jammu-and-kashmir.jpg`)

Document status: 200

_No issues captured._

### Karnataka (/regions/karnataka)

Screenshot: /tmp/qa-screenshots/063-region-karnataka.jpg (repo: `qa-screenshots/063-region-karnataka.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2022/07/Rava-Bonda-Recipe-Crispy-Sooji-Bonda-Semolina-Bonda-Fritters-2-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2022/07/Rava-Bonda-Recipe-Crispy-Sooji-Bonda-Semolina-Bonda-Fritters-2-scaled.jpeg (alt: Rava Bonda)

### Karnataka/Tamil Nadu (/regions/karnataka-tamil-nadu)

Screenshot: /tmp/qa-screenshots/064-region-karnataka-tamil-nadu.jpg (repo: `qa-screenshots/064-region-karnataka-tamil-nadu.jpg`)

Document status: 200

_No issues captured._

### Kerala (/regions/kerala)

Screenshot: /tmp/qa-screenshots/065-region-kerala.jpg (repo: `qa-screenshots/065-region-kerala.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2023/01/Inji-Puli-Recipe-Inji-Curry-Puliyinchi-Kerala-Style-Sweet-Sour-Ginger-Pickle-1-scaled.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2023/01/Inji-Puli-Recipe-Inji-Curry-Puliyinchi-Kerala-Style-Sweet-Sour-Ginger-Pickle-1-scaled.jpeg (alt: Injipuli)

### Maharashtra (/regions/maharashtra)

Screenshot: /tmp/qa-screenshots/066-region-maharashtra.jpg (repo: `qa-screenshots/066-region-maharashtra.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/mainPhotos/pav-bhaji-recipe-easy-mumbai-style-pav-bhaji-recipe-1.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/mainPhotos/pav-bhaji-recipe-easy-mumbai-style-pav-bhaji-recipe-1.jpeg (alt: Pao Bhaji)

### North East India (/regions/north-east-india)

Screenshot: /tmp/qa-screenshots/067-region-north-east-india.jpg (repo: `qa-screenshots/067-region-north-east-india.jpg`)

Document status: 200

_No issues captured._

### North India (/regions/north-india)

Screenshot: /tmp/qa-screenshots/068-region-north-india.jpg (repo: `qa-screenshots/068-region-north-india.jpg`)

Document status: 200

_No issues captured._

### Pan-Indian (/regions/pan-indian)

Screenshot: /tmp/qa-screenshots/069-region-pan-indian.jpg (repo: `qa-screenshots/069-region-pan-indian.jpg`)

Document status: 200

_No issues captured._

### Parsi (/regions/parsi)

Screenshot: /tmp/qa-screenshots/070-region-parsi.jpg (repo: `qa-screenshots/070-region-parsi.jpg`)

Document status: 200

- **request failed:** https://gujarattourism.com/content/dam/gujrattourism/images/religious-sites/udvada-parsi,-udvada/gallery/Udvada%20Parsi%20Udvada21.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://gujarattourism.com/content/dam/gujrattourism/images/religious-sites/udvada-parsi,-udvada/gallery/Udvada%20Parsi%20Udvada21.jpg (alt: Parsi)

### Punjab (/regions/punjab)

Screenshot: /tmp/qa-screenshots/071-region-punjab.jpg (repo: `qa-screenshots/071-region-punjab.jpg`)

Document status: 200

_No issues captured._

### Punjab/Awadh (/regions/punjab-awadh)

Screenshot: /tmp/qa-screenshots/072-region-punjab-awadh.jpg (repo: `qa-screenshots/072-region-punjab-awadh.jpg`)

Document status: 200

_No issues captured._

### Punjab/Awadh/Delhi (/regions/punjab-awadh-delhi)

Screenshot: /tmp/qa-screenshots/073-region-punjab-awadh-delhi.jpg (repo: `qa-screenshots/073-region-punjab-awadh-delhi.jpg`)

Document status: 200

_No issues captured._

### Punjab/Delhi (/regions/punjab-delhi)

Screenshot: /tmp/qa-screenshots/074-region-punjab-delhi.jpg (repo: `qa-screenshots/074-region-punjab-delhi.jpg`)

Document status: 200

_No issues captured._

### Punjab/Delhi/Awadh (/regions/punjab-delhi-awadh)

Screenshot: /tmp/qa-screenshots/075-region-punjab-delhi-awadh.jpg (repo: `qa-screenshots/075-region-punjab-delhi-awadh.jpg`)

Document status: 200

_No issues captured._

### Rajasthan (/regions/rajasthan)

Screenshot: /tmp/qa-screenshots/076-region-rajasthan.jpg (repo: `qa-screenshots/076-region-rajasthan.jpg`)

Document status: 200

- **request failed:** https://hebbarskitchen.com/wp-content/uploads/2019/02/mirchi-bada-recipe-mirchi-vada-how-to-make-rajasthani-mirchi-bada-1.jpeg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://hebbarskitchen.com/wp-content/uploads/2019/02/mirchi-bada-recipe-mirchi-vada-how-to-make-rajasthani-mirchi-bada-1.jpeg (alt: Mirchi Vada)

### Sindh (/regions/sindh)

Screenshot: /tmp/qa-screenshots/077-region-sindh.jpg (repo: `qa-screenshots/077-region-sindh.jpg`)

Document status: 200

_No issues captured._

### Tamil Nadu (/regions/tamil-nadu)

Screenshot: /tmp/qa-screenshots/078-region-tamil-nadu.jpg (repo: `qa-screenshots/078-region-tamil-nadu.jpg`)

Document status: 200

_No issues captured._

### Tamil Nadu/Karnataka (/regions/tamil-nadu-karnataka)

Screenshot: /tmp/qa-screenshots/079-region-tamil-nadu-karnataka.jpg (repo: `qa-screenshots/079-region-tamil-nadu-karnataka.jpg`)

Document status: 200

_No issues captured._

### Tamil Nadu/Karnataka/Kerala (/regions/tamil-nadu-karnataka-kerala)

Screenshot: /tmp/qa-screenshots/080-region-tamil-nadu-karnataka-kerala.jpg (repo: `qa-screenshots/080-region-tamil-nadu-karnataka-kerala.jpg`)

Document status: 200

_No issues captured._

### Telangana (/regions/telangana)

Screenshot: /tmp/qa-screenshots/081-region-telangana.jpg (repo: `qa-screenshots/081-region-telangana.jpg`)

Document status: 200

_No issues captured._

### Tribal North East India (/regions/tribal-north-east-india)

Screenshot: /tmp/qa-screenshots/082-region-tribal-north-east-india.jpg (repo: `qa-screenshots/082-region-tribal-north-east-india.jpg`)

Document status: 200

_No issues captured._

### Uttarakhand (/regions/uttarakhand)

Screenshot: /tmp/qa-screenshots/083-region-uttarakhand.jpg (repo: `qa-screenshots/083-region-uttarakhand.jpg`)

Document status: 200

_No issues captured._

### West Bengal (/regions/west-bengal)

Screenshot: /tmp/qa-screenshots/084-region-west-bengal.jpg (repo: `qa-screenshots/084-region-west-bengal.jpg`)

Document status: 200

- **request failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (net::ERR_BLOCKED_BY_ORB)
- **request failed:** https://experiencesofagastronomad.com/wp-content/uploads/2019/02/Gota-Shedhho2.jpg (net::ERR_BLOCKED_BY_ORB)
- **request failed:** https://experiencesofagastronomad.com/wp-content/uploads/2017/04/Komola-Phulkopi2.jpg (net::ERR_BLOCKED_BY_ORB)
- **image failed:** https://experiencesofagastronomad.com/wp-content/uploads/2021/07/Mishtir-Dokaner-Singara2.jpg (alt: Singhara)
- **image failed:** https://experiencesofagastronomad.com/komola-phulkopi/komola-phulkopi2 (alt: Kamala Phoolkopi)
- **image failed:** https://experiencesofagastronomad.com/gota-sheddho/gota-shedhho2 (alt: Gota Siddho)
