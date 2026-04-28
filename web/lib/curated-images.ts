import type { Recipe, Region, Section } from "./types";

export type CuratedImageKind = "recipe" | "section" | "region";
export type ImageResolutionSource = CuratedImageKind | "data" | "generic";

export interface CuratedImage {
  id: string;
  kind: CuratedImageKind;
  src: string;
  alt: string;
  sourceHref: string;
  sourceLabel: string;
  resolvedFrom: ImageResolutionSource;
}

type ImageManifestEntry = Omit<CuratedImage, "id" | "kind" | "resolvedFrom">;
type ImageManifest = Record<string, ImageManifestEntry>;

type RecipeImageInput = Pick<
  Recipe,
  "id" | "name" | "section_id" | "section_name" | "origin_region_id" | "origin_region_name"
> & { image?: string | null };

const SOURCE_LABEL = "Wikimedia Commons";

const genericImage: ImageManifestEntry = {
  src: "https://upload.wikimedia.org/wikipedia/commons/8/8b/North_Indian_Vegetarian_Thali-MB51.jpg",
  alt: "A North Indian vegetarian thali with rice, breads, curries, and accompaniments.",
  sourceHref: "https://commons.wikimedia.org/wiki/File:North_Indian_Vegetarian_Thali-MB51.jpg",
  sourceLabel: SOURCE_LABEL
};

const recipeImages: ImageManifest = {
  "subz-seekh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Veg_Seekh_kebab.jpg",
    alt: "Subz Seekh represented by grilled vegetarian seekh kebabs.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Veg_Seekh_kebab.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "paneer-tikka-kali-mirch": {
    src: "https://upload.wikimedia.org/wikipedia/commons/6/66/Paneer_tikka_1.jpg",
    alt: "Paneer Tikka Kali Mirch represented by grilled paneer tikka.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Paneer_tikka_1.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "nargisi-seekh-kebab": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/82/NargisiKofta.jpg",
    alt: "Nargisi Seekh Kebab represented by nargisi kofta.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:NargisiKofta.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "nargisi-seekh-kebab-2": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/82/NargisiKofta.jpg",
    alt: "Nargisi Seekh Kebab represented by nargisi kofta.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:NargisiKofta.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "tandoori-achari-khumb": {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Mushroom_tikk%C4%81_at_Kitchen_of_Awadh%2C_DLF_Phase_4%2C_Gurgaon_%282025-09-28%29.jpg",
    alt: "Tandoori Achari Khumb represented by mushroom tikka.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Mushroom_tikk%C4%81_at_Kitchen_of_Awadh,_DLF_Phase_4,_Gurgaon_(2025-09-28).jpg",
    sourceLabel: SOURCE_LABEL
  },
  "mirchi-vada": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Mirchi_Vada_bajji.jpg",
    alt: "Mirchi Vada served fried on a plate.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Mirchi_Vada_bajji.jpg",
    sourceLabel: SOURCE_LABEL
  },
  dosa: {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/43/Masala_dosa_01.jpg",
    alt: "Dosa served crisp with chutney and sambar.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Masala_dosa_01.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "masala-dosa": {
    src: "https://upload.wikimedia.org/wikipedia/commons/9/97/Masala_Dosa_in_Ballygunge%2C_Kolkata.jpg",
    alt: "Masala dosa on a plate.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Masala_Dosa_in_Ballygunge,_Kolkata.jpg",
    sourceLabel: SOURCE_LABEL
  },
  idli: {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/02/Idli_Sambar-Noida-UP-SP004.jpg",
    alt: "Idli with sambar and chutney.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Idli_Sambar-Noida-UP-SP004.jpg",
    sourceLabel: SOURCE_LABEL
  },
  dhokla: {
    src: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Dhokla_2.jpg",
    alt: "Dhokla cut into squares.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dhokla_2.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "dhokla-2": {
    src: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Dhokla_2.jpg",
    alt: "Dhokla cut into squares.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dhokla_2.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "pani-poori": {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Crispy_Pani_Puri.jpg",
    alt: "Pani Poori arranged on a plate.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Crispy_Pani_Puri.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "pao-bhaji": {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/34/Bhaji_pav_2.jpg",
    alt: "Pao Bhaji with buttered bread and vegetable bhaji.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Bhaji_pav_2.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "pao-bhaji-2": {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/34/Bhaji_pav_2.jpg",
    alt: "Pao Bhaji with buttered bread and vegetable bhaji.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Bhaji_pav_2.jpg",
    sourceLabel: SOURCE_LABEL
  },
  khandavi: {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Khandvi_with_Pudina_Chutney.JPG",
    alt: "Khandavi rolls served with chutney.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Khandvi_with_Pudina_Chutney.JPG",
    sourceLabel: SOURCE_LABEL
  },
  "mahi-tikka-ajwaini": {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/17/Fish_malai_tikka.jpg",
    alt: "Mahi Tikka Ajwaini represented by fish tikka.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Fish_malai_tikka.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "meen-biryani": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Fish_Biryani_02.jpg",
    alt: "Meen Biryani represented by fish biryani.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Fish_Biryani_02.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "biryani-i": {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Biryani_3.jpg",
    alt: "Biryani served in a large dish.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Biryani_3.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "kacchi-biryani": {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Kacchi_Biryani_Homemade.jpg",
    alt: "Kacchi Biryani in a serving pot.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Kacchi_Biryani_Homemade.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "gulab-jamun": {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/29/Gulab_Jamun_1.jpg",
    alt: "Gulab Jamun in syrup.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Gulab_Jamun_1.jpg",
    sourceLabel: SOURCE_LABEL
  },
  lassi: {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/59/Lassi_1.jpg",
    alt: "A glass of lassi.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Lassi_1.jpg",
    sourceLabel: SOURCE_LABEL
  }
};

const sectionImages: ImageManifest = {
  introduction: {
    ...genericImage,
    alt: "Introduction represented by a North Indian vegetarian thali."
  },
  "spice-mixtures-and-pastes": {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Garam_Masala_1.jpg",
    alt: "Spice Mixtures and Pastes represented by bowls of garam masala spices.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Garam_Masala_1.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "pickles-chutneys-and-raitas": {
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Lemon_pickle_%28_sweet%29.JPG",
    alt: "Pickles, Chutneys and Raitas represented by Indian lemon pickle.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Lemon_pickle_(_sweet).JPG",
    sourceLabel: SOURCE_LABEL
  },
  "snacks-and-appetizers": {
    src: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Samosa_with_chutney.jpg",
    alt: "Snacks and Appetizers represented by samosas with chutney.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Samosa_with_chutney.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "main-dishes": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_01.jpg",
    alt: "Main Dishes represented by a full Indian thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_01.jpg",
    sourceLabel: SOURCE_LABEL
  },
  pulses: {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Dal_Baati_2.jpg",
    alt: "Pulses represented by dal baati.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dal_Baati_2.jpg",
    sourceLabel: SOURCE_LABEL
  },
  breads: {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Naan_baked_in_Tandoor.jpg",
    alt: "Breads represented by naan baking in a tandoor.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Naan_baked_in_Tandoor.jpg",
    sourceLabel: SOURCE_LABEL
  },
  rice: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/38/Dum_Biryani_Plate.jpg",
    alt: "Rice represented by a plate of biryani.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dum_Biryani_Plate.jpg",
    sourceLabel: SOURCE_LABEL
  },
  desserts: {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Carrot_Halwa_and_Rabadi_Jamun_-_Bikash_Babu_Sweets_-_Trivandrum%2C_Kerala_-_DSC_0010.jpg",
    alt: "Desserts represented by carrot halwa and jamun sweets.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Carrot_Halwa_and_Rabadi_Jamun_-_Bikash_Babu_Sweets_-_Trivandrum,_Kerala_-_DSC_0010.jpg",
    sourceLabel: SOURCE_LABEL
  },
  drinks: {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/59/Lassi_1.jpg",
    alt: "Drinks represented by a glass of lassi.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Lassi_1.jpg",
    sourceLabel: SOURCE_LABEL
  },
  glossary: {
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Indian_Spices_%285105341568%29.jpg",
    alt: "Glossary represented by an array of Indian spices.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Indian_Spices_(5105341568).jpg",
    sourceLabel: SOURCE_LABEL
  },
  directory: {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Indian_spice_market.jpg",
    alt: "Directory represented by an Indian spice market.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Indian_spice_market.jpg",
    sourceLabel: SOURCE_LABEL
  },
  index: {
    ...genericImage,
    alt: "Index represented by a North Indian vegetarian thali."
  }
};

const regionImages: ImageManifest = {
  "andhra-pradesh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Andhra_Cuisine.jpg",
    alt: "Andhra Pradesh cuisine served on a plate.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Andhra_Cuisine.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "anglo-indian": {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Chicken_Pish_Pash.jpg",
    alt: "Anglo-Indian cuisine represented by chicken pish pash.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Chicken_Pish_Pash.jpg",
    sourceLabel: SOURCE_LABEL
  },
  awadh: {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tunday_Galwati_Mutton_Kebab-MB31.jpg",
    alt: "Awadh cuisine represented by galwati kebab.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Tunday_Galwati_Mutton_Kebab-MB31.jpg",
    sourceLabel: SOURCE_LABEL
  },
  bengal: {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bengali_food_cuisine.jpg",
    alt: "Bengal cuisine served as a meal.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Bengali_food_cuisine.jpg",
    sourceLabel: SOURCE_LABEL
  },
  coastal: {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Chef_Kiran_T_J%27s_Signature_Mangalapuram_Njandu_Curry_%28Crab_Roast%29.jpg",
    alt: "Coastal Indian cuisine represented by crab curry.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Chef_Kiran_T_J%27s_Signature_Mangalapuram_Njandu_Curry_(Crab_Roast).jpg",
    sourceLabel: SOURCE_LABEL
  },
  delhi: {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/15/Daulat_Chaat_in_Old_Delhi.JPG",
    alt: "Delhi cuisine represented by Daulat Chaat.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Daulat_Chaat_in_Old_Delhi.JPG",
    sourceLabel: SOURCE_LABEL
  },
  "delhi-bhopal": {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Paneer_Tikka_with_Green_Chutney_by_Nerbada_Restaurant_in_Bhopal_Madhya_Pradesh.jpg",
    alt: "Delhi/Bhopal cuisine represented by paneer tikka with chutney.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Paneer_Tikka_with_Green_Chutney_by_Nerbada_Restaurant_in_Bhopal_Madhya_Pradesh.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "delhi-madhya-pradesh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Indore_Thali%2C_Ajab_Gajab_Restaurant%2C_Limbodi%2C_Indore%2C_Madhya_Pradesh%2C_IMG_20181026_155441414.jpg",
    alt: "Delhi/Madhya Pradesh cuisine represented by an Indore thali.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Indore_Thali,_Ajab_Gajab_Restaurant,_Limbodi,_Indore,_Madhya_Pradesh,_IMG_20181026_155441414.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "delhi-punjab-awadh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Essentails_of_a_north_indian_cuisine_%21.jpg",
    alt: "Delhi/Punjab/Awadh cuisine represented by a North Indian meal.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Essentails_of_a_north_indian_cuisine_!.jpg",
    sourceLabel: SOURCE_LABEL
  },
  goa: {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Fish-curry-rice%2C_Goan-style_01.jpg",
    alt: "Goa cuisine represented by Goan fish curry and rice.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Fish-curry-rice,_Goan-style_01.jpg",
    sourceLabel: SOURCE_LABEL
  },
  gujarat: {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/19/Authentic_gujarati_thali.jpg",
    alt: "Gujarat cuisine represented by a Gujarati thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Authentic_gujarati_thali.jpg",
    sourceLabel: SOURCE_LABEL
  },
  hyderabad: {
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Chicken_Hyderabadi_Biryani.JPG",
    alt: "Hyderabad cuisine represented by Hyderabadi biryani.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Chicken_Hyderabadi_Biryani.JPG",
    sourceLabel: SOURCE_LABEL
  },
  "hyderabad-andhra-pradesh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/6/65/Biryani_Godavari_style.JPG",
    alt: "Hyderabad/Andhra Pradesh cuisine represented by Godavari-style biryani.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Biryani_Godavari_style.JPG",
    sourceLabel: SOURCE_LABEL
  },
  "jammu-and-kashmir": {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Mutton_rogan_Josh_%28kashmiri_cuisine%29.jpg",
    alt: "Jammu and Kashmir cuisine represented by rogan josh.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Mutton_rogan_Josh_(kashmiri_cuisine).jpg",
    sourceLabel: SOURCE_LABEL
  },
  karnataka: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/33/Dosa_3.jpg",
    alt: "Karnataka cuisine represented by dosa.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dosa_3.jpg",
    sourceLabel: SOURCE_LABEL
  },
  kerala: {
    src: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Sadya-Aluva-Kerala-IMG_20210320_204532.jpg",
    alt: "Kerala cuisine represented by a sadya meal.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Sadya-Aluva-Kerala-IMG_20210320_204532.jpg",
    sourceLabel: SOURCE_LABEL
  },
  maharashtra: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/35/Maharashtrian_Thali_2.JPG",
    alt: "Maharashtra cuisine represented by a Maharashtrian thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Maharashtrian_Thali_2.JPG",
    sourceLabel: SOURCE_LABEL
  },
  "north-east-india": {
    src: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Ingredients_for_making_traditional_Meitei_food%2C_Eromba_%28alias_Iromba%2C_Eronba%2C_Ironba%29_-_Classical_Meitei_cuisine_of_Kangleipak.jpg",
    alt: "North East India cuisine represented by ingredients for eromba.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Ingredients_for_making_traditional_Meitei_food,_Eromba_(alias_Iromba,_Eronba,_Ironba)_-_Classical_Meitei_cuisine_of_Kangleipak.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "pan-indian": {
    ...genericImage,
    alt: "Pan-Indian cuisine represented by a North Indian vegetarian thali."
  },
  parsi: {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Dhansak.JPG",
    alt: "Parsi cuisine represented by dhansak.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dhansak.JPG",
    sourceLabel: SOURCE_LABEL
  },
  punjab: {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/58/Punjabi_food_at_Bade_Bhai_Ka_Brothers_Dhaba.jpg",
    alt: "Punjab cuisine represented by a Punjabi meal.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Punjabi_food_at_Bade_Bhai_Ka_Brothers_Dhaba.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "punjab-awadh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_01.jpg",
    alt: "Punjab/Awadh cuisine represented by a North Indian thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_01.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "punjab-delhi": {
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8b/North_Indian_Vegetarian_Thali-MB51.jpg",
    alt: "Punjab/Delhi cuisine represented by a North Indian vegetarian thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:North_Indian_Vegetarian_Thali-MB51.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "punjab-delhi-awadh": {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_02.jpg",
    alt: "Punjab/Delhi/Awadh cuisine represented by a North Indian thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Non_Veg_Thali_-_Gandhi_Nagar_Jammu_-_Jammu_%26_Kashmir_-_02.jpg",
    sourceLabel: SOURCE_LABEL
  },
  rajasthan: {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Rajasthani_thali_%2813041306695%29.jpg",
    alt: "Rajasthan cuisine represented by a Rajasthani thali.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Rajasthani_thali_(13041306695).jpg",
    sourceLabel: SOURCE_LABEL
  },
  sindh: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Dal_Pakwan_-_Sindhi_Food_-_5.jpg",
    alt: "Sindh cuisine represented by dal pakwan.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dal_Pakwan_-_Sindhi_Food_-_5.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "tamil-nadu": {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/77/Ghee_Podi_Onion_Uthappam_-_Murugan_Idli_Shop%2C_Chennai_-_TamilNadu_-_PXL1034.jpg",
    alt: "Tamil Nadu cuisine represented by onion uthappam.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Ghee_Podi_Onion_Uthappam_-_Murugan_Idli_Shop,_Chennai_-_TamilNadu_-_PXL1034.jpg",
    sourceLabel: SOURCE_LABEL
  },
  telangana: {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d1/South_Indian_cuisine_with_mushroom_and_peas.jpg",
    alt: "Telangana cuisine represented by a South Indian mushroom and peas dish.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:South_Indian_cuisine_with_mushroom_and_peas.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "tribal-north-east-india": {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Yerum_Tal_%28also_known_as_Yerum_Tan%2C_Yeroom_Tal%2C_Yeroom_Tan%29_-_traditional_Meitei_omelet_%28omelette%29_-_Classical_Meitei_cuisine_02.jpg",
    alt: "Tribal North East India cuisine represented by a Meitei omelet.",
    sourceHref:
      "https://commons.wikimedia.org/wiki/File:Yerum_Tal_(also_known_as_Yerum_Tan,_Yeroom_Tal,_Yeroom_Tan)_-_traditional_Meitei_omelet_(omelette)_-_Classical_Meitei_cuisine_02.jpg",
    sourceLabel: SOURCE_LABEL
  },
  uttarakhand: {
    src: "https://upload.wikimedia.org/wikipedia/commons/4/48/Rice_dal_with_whey_and_butter%2C_dhanaulti%2C_uttarakhand_1.jpg",
    alt: "Uttarakhand cuisine represented by rice and dal.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Rice_dal_with_whey_and_butter,_dhanaulti,_uttarakhand_1.jpg",
    sourceLabel: SOURCE_LABEL
  },
  "west-bengal": {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Food_for_Lunch_-_WLM2016_in_West_Bengal.jpg",
    alt: "West Bengal cuisine represented by a lunch plate.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Food_for_Lunch_-_WLM2016_in_West_Bengal.jpg",
    sourceLabel: SOURCE_LABEL
  }
};

function manifestForKind(kind: CuratedImageKind) {
  if (kind === "recipe") {
    return recipeImages;
  }

  if (kind === "region") {
    return regionImages;
  }

  return sectionImages;
}

function makeImage(
  kind: CuratedImageKind,
  id: string,
  entry: ImageManifestEntry,
  resolvedFrom: ImageResolutionSource
): CuratedImage {
  return {
    id,
    kind,
    resolvedFrom,
    ...entry
  };
}

function fallbackAlt(label: string, entry: ImageManifestEntry) {
  return `${label}, represented by ${entry.alt.charAt(0).toLowerCase()}${entry.alt.slice(1)}`;
}

function internetImageFromData(kind: CuratedImageKind, id: string, label: string, src: string | null | undefined) {
  if (!src || !/^https?:\/\//.test(src)) {
    return null;
  }

  return makeImage(
    kind,
    id,
    {
      src,
      alt: label,
      sourceHref: src,
      sourceLabel: "Image source"
    },
    "data"
  );
}

export function getCuratedImage(kind: CuratedImageKind, id: string, label: string): CuratedImage {
  const entry = manifestForKind(kind)[id];

  if (entry) {
    return makeImage(kind, id, entry, kind);
  }

  return makeImage(kind, id, { ...genericImage, alt: fallbackAlt(label, genericImage) }, "generic");
}

export function resolveSectionImage(section: Pick<Section, "id" | "name" | "hero_image">): CuratedImage {
  const dataImage = internetImageFromData("section", section.id, section.name, section.hero_image);

  if (dataImage) {
    return dataImage;
  }

  return getCuratedImage("section", section.id, section.name);
}

export function resolveRegionImage(region: Pick<Region, "id" | "name" | "hero_image">): CuratedImage {
  const dataImage = internetImageFromData("region", region.id, region.name, region.hero_image);

  if (dataImage) {
    return dataImage;
  }

  return getCuratedImage("region", region.id, region.name);
}

export function resolveRecipeImage(recipe: RecipeImageInput): CuratedImage {
  const dataImage = internetImageFromData("recipe", recipe.id, recipe.name, recipe.image);

  if (dataImage) {
    return dataImage;
  }

  const recipeEntry = recipeImages[recipe.id];

  if (recipeEntry) {
    return makeImage("recipe", recipe.id, recipeEntry, "recipe");
  }

  const regionEntry = regionImages[recipe.origin_region_id];

  if (regionEntry) {
    return makeImage("recipe", recipe.id, { ...regionEntry, alt: fallbackAlt(recipe.name, regionEntry) }, "region");
  }

  const sectionEntry = sectionImages[recipe.section_id];

  if (sectionEntry) {
    return makeImage("recipe", recipe.id, { ...sectionEntry, alt: fallbackAlt(recipe.name, sectionEntry) }, "section");
  }

  return makeImage("recipe", recipe.id, { ...genericImage, alt: fallbackAlt(recipe.name, genericImage) }, "generic");
}
