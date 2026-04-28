# Data Audit

Generated: 2026-04-28T07:06:06.952Z

## Scope

- `data/recipes.json`
- `data/sections.json`
- `data/regions.json`
- `data/glossary.json`
- Related directory/index data files, when present
- `data/images/` recursive file-size scan
- Cross-reference integrity checks for recipe references and recipe-id indexes

## Summary

| Check | Count |
| --- | --- |
| Image references checked | 665 |
| Missing image fields | 1 |
| Invalid image references | 0 |
| Missing local image files | 0 |
| Duplicate image references | 0 |
| Image files under 50KB | 13 |
| Unresolved recipe cross-references | 213 |
| Missing section recipe ids | 0 |
| Missing region recipe ids | 0 |
| Missing ingredient recipe ids | 0 |
| Missing tag recipe ids | 0 |
| Missing graph recipe ids | 0 |
| Missing recipe taxonomy ids | 0 |
| Empty glossary entry files | 1 |
| Missing directory/index data files | 2 |

## Image Field Issues

### Missing Image Fields

| file | type | id | name | field |
| --- | --- | --- | --- | --- |
| data/front-matter.json | frontMatter | regions_overview | Food Regions of India | map_image |

### Invalid Image References

_None found._

### Missing Local Image Files

_None found._

### Duplicate Image References

_None found._


### Image Files Under 50KB

| file | sizeBytes |
| --- | --- |
| data/images/recipes/palpayasam.webp | 18556 |
| data/images/recipes/alubokhara-kofta.webp | 19494 |
| data/images/recipes/nimboo-ka-sherbet.webp | 28756 |
| data/images/recipes/chandi-qorma.webp | 29998 |
| data/images/recipes/dahi-ki-karhi-2.webp | 31972 |
| data/images/recipes/bharwan-khumb.webp | 33988 |
| data/images/recipes/til-ki-chutney.webp | 45514 |
| data/images/recipes/paneer-tikka-kali-mirch.webp | 45820 |
| data/images/recipes/aloo-ki-kheer.webp | 46764 |
| data/images/recipes/arbai-ke-patte.webp | 47210 |
| data/images/recipes/kairi-ka-sherbet.webp | 49050 |
| data/images/recipes/mirchiwala-gosht.webp | 49188 |
| data/images/recipes/dahi-ma-bheeda.webp | 49964 |

## Reference/Data Integrity Issues

### Empty Glossary Data

| file | issue |
| --- | --- |
| data/glossary.json | `entries` is present but empty |

### Missing Directory/Index Data Files

| file | issue |
| --- | --- |
| data/directory.json | File not present in /data |
| data/index.json | File not present in /data |

### Unresolved Recipe Cross-References

| recipe | recipeName | ref | page | id | issue |
| --- | --- | --- | --- | --- | --- |
| garam-masala-i | Garam Masala (I) | sterilized container storage | 791 |  | missing id |
| garam-masala-ii | Garam Masala (II) | sterilized container instructions | 791 |  | missing id |
| seb-ki-chutney | Seb ki Chutney | Storage information | 791 |  | missing id |
| aam-ka-achar | Aam ka Achar | sterilized jars | 791 |  | missing id |
| nimboo-ka-achar | Nimboo ka Achar | sterilized jars | 791 |  | missing id |
| papite-ka-achar | Papite ka Achar | sterilized glass jars | 791 |  | missing id |
| tamatar-ka-achar | Tamatar ka Achar | sterilized jars | 791 |  | missing id |
| subz-seekh | Subz Seekh | Mint Chutney | 66 |  | missing id |
| bhutta-seekh-kebab | Bhutta Seekh Kebab | Garam Masala | 31 |  | missing id |
| bhutta-seekh-kebab | Bhutta Seekh Kebab | Chaat Masala | 31 |  | missing id |
| bhutta-seekh-kebab | Bhutta Seekh Kebab | Tandoori Masala | 51 |  | missing id |
| nargisi-seekh-kebab | Nargisi Seekh Kebab | Chaat Masala | 31 |  | missing id |
| nargisi-seekh-kebab-2 | Nargisi Seekh Kebab | Chaat Masala | 31 |  | missing id |
| tandoori-achari-khumb | Tandoori Achari Khumb | Yoghurt | 793 |  | missing id |
| tandoori-achari-khumb | Tandoori Achari Khumb | Garam Masala | 31 |  | missing id |
| methi-pakora | Methi Pakora | Garam Masala | 31 |  | missing id |
| cheese-ke-bhajiya | Cheese ke Bhajiya | Garam Masala | 31 |  | missing id |
| poha-pulao | Poha Pulao | Garam Masala | 31 |  | missing id |
| dahi-ke-kebab | Dahi ke Kebab | Hung yoghurt | 793 |  | missing id |
| dahi-ke-kebab | Dahi ke Kebab | Garam Masala | 31 |  | missing id |
| arabi-ke-kebab | Arabi ke Kebab | Garam Masala | 31 |  | missing id |
| rava-bonda | Rava Bonda | Sour Yoghurt | 793 |  | missing id |
| raj-kachori | Raj Kachori | Chickpeas (garbanzo beans) | 37 |  | missing id |
| raj-kachori | Raj Kachori | Raw Tamarind Chutney | 66 |  | missing id |
| raj-kachori | Raj Kachori | Mint Chutney | 66 |  | missing id |
| pao-bhaji | Pao Bhaji | Garam Masala | 31 |  | missing id |
| dosa | Dosa | Sambhar | 543 |  | missing id |
| rava-dosa | Rava Dosa | Sambhar | 543 |  | missing id |
| masala-dosa | Masala Dosa | Sambhar | 543 |  | missing id |
| paper-dosa | Paper Dosa | Sambhar | 543 |  | missing id |
| idli | Idli | Sambhar | 543 |  | missing id |
| idli | Idli | Karpodi | 51 |  | missing id |
| dhokla | Dhokla | Raw Tamarind Chutney or Mint Chutney | 66 |  | missing id |
| dhokla-2 | Dhokla | Raw Tamarind Chutney or Mint Chutney | 66 |  | missing id |
| dahi-ki-gujiya | Dahi ki Gujiya | Mint Chutney | 66 |  | missing id |
| dahi-papri-ki-chaat | Dahi Papri ki Chaat | Tamarind Chutney | 64 |  | missing id |
| dahi-papri-ki-chaat | Dahi Papri ki Chaat | Ginger Chutney | 64 |  | missing id |
| dahi-papri-ki-chaat | Dahi Papri ki Chaat | Chaat Masala | 31 |  | missing id |
| pani-poori | Pani Poori | Chaat Masala | 31 |  | missing id |
| pani-poori | Pani Poori | Tamarind & Ginger Chutney | 65 |  | missing id |
| aloo-chaat | Aloo Chaat | Chaat Masala | 31 |  | missing id |
| tandoori-bharwan-tamatar-2 | Tandoori Bharwan Tamatar | hung natural (plain) yoghurt | 793 |  | missing id |
| tandoori-bharwan-tamatar-2 | Tandoori Bharwan Tamatar | Tamarind & Ginger Chutney | 65 |  | missing id |
| lehsuni-paneer-tikka | Lehsuni Paneer Tikka | Garam Masala | 31 |  | missing id |
| lehsuni-paneer-tikka | Lehsuni Paneer Tikka | Chaat Masala | 31 |  | missing id |
| lehsuni-paneer-tikka | Lehsuni Paneer Tikka | Tandoori Chaat Masala | 51 |  | missing id |
| tandoori-bharwan-paneer | Tandoori Bharwan Paneer | Chaat Masala | 31 |  | missing id |
| tandoori-bharwan-paneer | Tandoori Bharwan Paneer | Garam Masala | 31 |  | missing id |
| tandoori-bharwan-paneer | Tandoori Bharwan Paneer | hung natural (plain) yoghurt | 793 |  | missing id |
| pao-bhaji-2 | Pao Bhaji | Garam Masala | 31 |  | missing id |
| moru-kalli | Moru Kalli | Sour Yoghurt | 793 |  | missing id |
| arisi-pulao | Arisi Pulao | Coconut Water | 781 |  | missing id |
| mahi-tikka-ajwaini | Mahi Tikka Ajwaini | hung natural yoghurt | 793 |  | missing id |
| mahi-tikka-ajwaini | Mahi Tikka Ajwaini | Garam Masala | 31 |  | missing id |
| hara-mahi-tikka | Hara Mahi Tikka | hung natural (plain) yoghurt | 793 |  | missing id |
| khatti-meethi-machhali | Khatti Meethi Machhali | Garam Masala | 31 |  | missing id |
| khatti-meethi-machhali | Khatti Meethi Machhali | hung natural (plain) yoghurt | 793 |  | missing id |
| hare-jhinga | Hare Jhinga | Garam Masala | 31 |  | missing id |
| hare-jhinga | Hare Jhinga | hung natural (plain) yoghurt | 793 |  | missing id |
| kakori-kebab | Kakori Kebab | Garam Masala | 31 |  | missing id |
| kakori-kebab | Kakori Kebab | Mint Chutney | 66 |  | missing id |
| maans-ke-soole | Maans ke Soole | Garam Masala | 31 |  | missing id |
| maans-ke-soole | Maans ke Soole | hung natural (plain) yoghurt | 793 |  | missing id |
| kashmiri-seekh-kebab | Kashmiri Seekh Kebab | Garam Masala | 31 |  | missing id |
| kachhe-keeme-ki-tikya | Kachhe Keeme ki Tikya | Garam Masala | 31 |  | missing id |
| kachhe-keeme-ki-tikya-2 | Kachhe Keeme ki Tikya | hung natural (plain) yoghurt | 793 |  | missing id |
| kachhe-keeme-ki-tikya-2 | Kachhe Keeme ki Tikya | Garam Masala | 31 |  | missing id |
| galouti | Galouti | Garam Masala | 31 |  | missing id |
| pasanda-kebab | Pasanda Kebab | Garam Masala | 31 |  | missing id |
| sikampoor-kebab-i | Sikampoor Kebab (I) | Mint Chutney | 66 |  | missing id |
| sikampoor-kebab-i-2 | Sikampoor Kebab (I) | Mint Chutney | 66 |  | missing id |
| raan-patialashai | Raan Patialashai | hung natural (plain) yoghurt | 793 |  | missing id |
| raan-patialashai-2 | Raan Patialashai | hung natural (plain) yoghurt | 793 |  | missing id |
| bhune-kebab | Bhune Kebab | Mint Chutney | 66 |  | missing id |
| kaleji-kebab | Kaleji Kebab | Garam Masala | 31 |  | missing id |
| murg-dalcha-kebab | Murg Dalcha Kebab | Garam Masala | 31 |  | missing id |
| murg-dalcha-kebab | Murg Dalcha Kebab | Hung Natural Yoghurt | 793 |  | missing id |
| kashmiri-murg-kebab | Kashmiri Murg Kebab | hung natural (plain) yoghurt | 793 |  | missing id |
| tandoori-murg | Tandoori Murg | Chaat Masala | 31 |  | missing id |
| tandoori-murg | Tandoori Murg | Garam Masala | 31 |  | missing id |
| tandoori-murg | Tandoori Murg | hung natural (plain) yoghurt | 793 |  | missing id |
| kandahari-murg-tikka | Kandahari Murg Tikka | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-methi-tikka | Murg Methi Tikka | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-ke-parche | Murg ke Parche | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-manpasand | Murg Manpasand | Garam Masala | 31 |  | missing id |
| chicken-pakora | Chicken Pakora | Chaat Masala | 31 |  | missing id |
| chicken-pakora | Chicken Pakora | Garam Masala | 31 |  | missing id |
| chharra-aloo | Chharra Aloo | Garam Masala | 31 |  | missing id |
| dahiwale-aloo | Dahiwale Aloo | Garam Masala | 31 |  | missing id |
| uralaikizhan-sagu | Uralaikizhan Sagu | Coconut Milk | 781 |  | missing id |
| uralaikizhan-sagu-2 | Uralaikizhan Sagu | coconut milk | 781 |  | missing id |
| aloo-chutneywale | Aloo Chutneywale | Garam Masala | 31 |  | missing id |
| rajasthani-arabi | Rajasthani Arabi | Garam Masala | 31 |  | missing id |
| dum-ki-bhindi | Dum ki Bhindi | Garam Masala | 31 |  | missing id |
| vendakkai-igguru | Vendakkai Igguru | Coconut Milk | 781 |  | missing id |
| baghare-baigan | Baghare Baigan | Garam Masala | 31 |  | missing id |
| bharwan-baigan | Bharwan Baigan | Garam Masala | 31 |  | missing id |
| khatte-meethe-baigan | Khatte Meethe Baigan | Mint Chutney | 66 |  | missing id |
| khatte-meethe-baigan | Khatte Meethe Baigan | Garam Masala | 31 |  | missing id |
| kathhal-dopyaza | Kathhal Dopyaza | jackfruit preparation | 793 |  | missing id |
| dum-kathal | Dum Kathal | Garam Masala | 31 |  | missing id |
| bharwan-guchhi | Bharwan Guchhi | Hung natural (plain) yoghurt | 793 |  | missing id |
| bharwan-guchhi | Bharwan Guchhi | Garam Masala | 31 |  | missing id |
| bharwan-khumb | Bharwan Khumb | Garam Masala | 31 |  | missing id |
| bharwan-karele | Bharwan Karele | Garam Masala | 31 |  | missing id |
| bharwan-parwal | Bharwan Parwal | Garam Masala | 31 |  | missing id |
| bharwan-parwal-2 | Bharwan Parwal | Garam Masala | 31 |  | missing id |
| potoler-dolma | Potoler Dolma | Garam Masala | 31 |  | missing id |
| paneer-pasanda | Paneer Pasanda | Garam Masala | 31 |  | missing id |
| paneer-pasanda | Paneer Pasanda | Mixed Pickle | 787 |  | missing id |
| paneer-makhani | Paneer Makhani | Garam Masala | 31 |  | missing id |
| achari-paneer | Achari Paneer | Garam Masala | 31 |  | missing id |
| chaaman | Chaaman | Garam Masala | 31 |  | missing id |
| dakhani-paneer | Dakhani Paneer | Coconut Paste | 781 |  | missing id |
| dakhani-paneer | Dakhani Paneer | Garam Masala | 31 |  | missing id |
| dakhani-paneer-2 | Dakhani Paneer | Garam Masala | 31 |  | missing id |
| kachnar-ki-kali | Kachnar ki Kali | Garam Masala | 31 |  | missing id |
| flower-batata-bhaji | Flower Batata Bhaji | Garam Masala | 31 |  | missing id |
| avial | Avial | Coconut milk | 781 |  | missing id |
| tengaipal-pitha-kotu | Tengaipal Pitha Kotu | Sambhar Masala | 32 |  | missing id |
| machhali-musallam | Machhali Musallam | Garam Masala | 31 |  | missing id |
| bhunee-machhali | Bhunee Machhali | Garam Masala | 31 |  | missing id |
| bhunee-machhali-2 | Bhunee Machhali | Garam Masala | 31 |  | missing id |
| chincheche-talwan | Chincheche Talwan | Garam Masala | 31 |  | missing id |
| karhai-machhali | Karhai Machhali | Garam Masala | 31 |  | missing id |
| jhingri-machher-malikari | Jhingri Machher Malikari | Coconut milk | 781 |  | missing id |
| kolambini-bharaleli-bhaji | Kolambini Bharaleli Bhaji | Garam Masala | 31 |  | missing id |
| bhaji-ani-kolambicha-stew | Bhaji ani Kolambicha Stew | Garam Masala | 31 |  | missing id |
| chimbori-shengdanya-kalwan | Chimbori Shengdanya Kalwan | Garam Masala | 31 |  | missing id |
| aloo-gosht | Aloo Gosht | Garam Masala | 31 |  | missing id |
| qorma-dum-pukht | Qorma dum Pukht | Garam Masala | 31 |  | missing id |
| shahi-qorma | Shahi Qorma | Garam Masala | 31 |  | missing id |
| shahi-qorma-2 | Shahi Qorma | Garam Masala | 31 |  | missing id |
| baadam-pasanda | Baadam Pasanda | Garam Masala | 31 |  | missing id |
| halim | Halim | Garam Masala | 31 |  | missing id |
| amras-ki-boti | Amras ki Boti | Garam Masala | 31 |  | missing id |
| jardalu-boti | Jardalu Boti | Garam Masala | 31 |  | missing id |
| dahiwala-meat | Dahiwala Meat | Garam Masala | 31 |  | missing id |
| roghanjosh | Roghanjosh | Garam Masala | 31 |  | missing id |
| mutton-coconut-fry | Mutton Coconut Fry | Coconut milk | 781 |  | missing id |
| chaamp-chops | Chaamp Chops | Garam Masala | 31 |  | missing id |
| masala-chaamp | Masala Chaamp | Garam Masala | 31 |  | missing id |
| masala-chaamp-2 | Masala Chaamp | Garam Masala | 31 |  | missing id |
| aloo-ka-salan | Aloo ka Salan | Garam Masala | 31 |  | missing id |
| bharwan-pasande | Bharwan Pasande | Garam Masala | 31 |  | missing id |
| gosht-ki-khurchan | Gosht ki Khurchan | Garam Masala | 31 |  | missing id |
| kairi-ka-do-pyaza | Kairi ka do Pyaza | Garam Masala | 31 |  | missing id |
| keema-matar | Keema Matar | Garam Masala | 31 |  | missing id |
| kofta-curry | Kofta Curry | Chapatti or Paratha | 609 |  | missing id |
| dhoop-chhaun-keema | Dhoop Chhaun Keema | Paratha | 609 |  | missing id |
| dahi-ka-keema | Dahi ka Keema | Garam Masala | 31 |  | missing id |
| handiwala-murg | Handiwala Murg | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-ke-soole-2 | Murg ke Soole | Yoghurt | 793 |  | missing id |
| chandi-qorma | Chandi Qorma | Char Magaz | 780 |  | missing id |
| chandi-qorma | Chandi Qorma | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-musallam | Murg Musallam | Chicken, dressed | 780 |  | missing id |
| murg-musallam | Murg Musallam | Garam Masala | 31 |  | missing id |
| murg-qorma-ii | Murg Qorma (II) | hung natural (plain) yoghurt | 793 |  | missing id |
| murg-qorma-ii | Murg Qorma (II) | dough | 783 |  | missing id |
| shahi-qorma-3 | Shahi Qorma | Garam Masala | 31 |  | missing id |
| khatta-murg | Khatta Murg | Yoghurt | 793 |  | missing id |
| kondapur-koli-thalna | Kondapur Koli Thalna | Coconut paste | 781 |  | missing id |
| kondapur-koli-thalna | Kondapur Koli Thalna | Coconut milk | 781 |  | missing id |
| kondapur-koli-thalna | Kondapur Koli Thalna | Coconut cream | 781 |  | missing id |
| bohri-chicken | Bohri Chicken | Dough for sealing | 783 |  | missing id |
| murg-ishtoo | Murg Ishtoo | Garam Masala | 31 |  | missing id |
| dum-ka-murg | Dum ka Murg | Garam Masala | 31 |  | missing id |
| dum-ka-murg | Dum ka Murg | hung natural (plain) yoghurt | 793 |  | missing id |
| sandali-murg | Sandali Murg | Chaar Magaz | 780 |  | missing id |
| chaar-magaz-ka-murg | Chaar Magaz ka Murg | chaar magaz | 780 |  | missing id |
| chaar-magaz-ka-murg-2 | Chaar Magaz ka Murg | Chaar Magaz | 780 |  | missing id |
| murg-lazawab | Murg Lazawab | Garam Masala | 31 |  | missing id |
| thenga-chertha-ulli-sambhar | Thenga Chertha Ulli Sambhar | Sambhar Masala | 32 |  | missing id |
| khatte-chole | Khatte Chole | Garam Masala | 31 |  | missing id |
| moong-dal | Moong Dal | Garam Masala | 31 |  | missing id |
| dal-ka-kima | Dal ka Kima | Garam Masala | 31 |  | missing id |
| karhi-pakori-2 | Karhi Pakori | page 117 | 117 |  | missing id |
| sookhi-mangori | Sookhi Mangori | Garam Masala | 31 |  | missing id |
| dal-ki-kaleji | Dal ki Kaleji | Garam Masala | 31 |  | missing id |
| dal-ki-kaleji-2 | Dal ki Kaleji | Garam Masala | 31 |  | missing id |
| bervin-poori-2 | Bervin Poori | Poori | 593 |  | missing id |
| matar-paneer-ka-paratha | Matar-Paneer ka Paratha | Garam Masala | 31 |  | missing id |
| amritsari-kulcha | Amritsari Kulcha | Garam Masala | 31 |  | missing id |
| appam | Appam | Coconut milk | 781 |  | missing id |
| kurmu-pulao | Kurmu Pulao | Glove handling reference | 793 |  | missing id |
| kurmu-pulao | Kurmu Pulao | Coconut milk | 781 |  | missing id |
| kurmu-pulao-2 | Kurmu Pulao | Wearing gloves | 793 |  | missing id |
| kurmu-pulao-2 | Kurmu Pulao | coconut milk | 781 |  | missing id |
| kabuli-chaneda-pulao | Kabuli Chaneda Pulao | dough (for sealing) | 783 |  | missing id |
| gatte-ka-pulao | Gatte ka Pulao | Garam Masala | 31 |  | missing id |
| mamri-kaya-pulihora | Mamri Kaya Pulihora | Rasam | 563 |  | missing id |
| baadami-chawal-bariyan | Baadami Chawal Bariyan | Garam Masala | 31 |  | missing id |
| biryani-i | Biryani (I) | Dough (for sealing) | 783 |  | missing id |
| biryani-ii | Biryani (II) | dough | 783 |  | missing id |
| kacchi-biryani | Kacchi Biryani | Dough | 783 |  | missing id |
| hyderabadi-dum-ki-biryani | Hyderabadi Dum ki Biryani | Dough for sealing | 783 |  | missing id |
| awadhi-gosht-biryani | Awadhi Gosht Biryani | Dough for sealing | 783 |  | missing id |
| qorma-pulao | Qorma Pulao | dough for sealing | 783 |  | missing id |
| moti-pulao | Moti Pulao | Dough for sealing | 783 |  | missing id |
| mutanian-pulao | Mutanian Pulao | Dough | 783 |  | missing id |
| murg-biryani | Murg Biryani | Dough | 783 |  | missing id |
| odi-pulao | Odi Pulao | Coconut milk | 781 |  | missing id |
| gil-e-behisht | Gil e Behisht | hung natural (plain) yoghurt | 793 |  | missing id |
| shrikhand | Shrikhand | Hung Natural (Plain) Yoghurt | 793 |  | missing id |
| zarda | Zarda | dough | 783 |  | missing id |
| kadalaparippu-payasam | Kadalaparippu Payasam | Syrup consistency guide | 50 |  | missing id |
| kadalaparippu-payasam | Kadalaparippu Payasam | Coconut milk | 781 |  | missing id |
| kadalaparippu-payasam | Kadalaparippu Payasam | Coconut cream | 781 |  | missing id |
| kadalaparippu-payasam-2 | Kadalaparippu Payasam | Coconut milk | 781 |  | missing id |
| kadalaparippu-payasam-2 | Kadalaparippu Payasam | Coconut cream | 781 |  | missing id |
| seb-ka-ras | Seb ka Ras | sterilized bottle | 791 |  | missing id |
| nimboo-ka-sherbet | Nimboo ka Sherbet | Sterilized bottle | 791 |  | missing id |
| kesar-elaychi-sherbet | Kesar Elaychi Sherbet | sterilized bottle | 791 |  | missing id |

### Missing Recipe IDs In Section Indexes

_None found._

### Missing Recipe IDs In Region Indexes

_None found._

### Missing Recipe IDs In Ingredient Indexes

_None found._

### Missing Recipe IDs In Tag Indexes

_None found._

### Missing Recipe IDs In Graph Edges

_None found._

### Missing Recipe Taxonomy IDs

_None found._
