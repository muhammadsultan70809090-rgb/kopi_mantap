// 12 produk contoh yang dipakai saat database masih kosong.
export const seedProducts = [
  {
    name: 'Kopi Susu Mantap',
    category: 'Coffee Milk',
    price: 22000,
    featured: 1,
    description:
      'Signature house blend espresso dipadu susu segar dan gula aren cair. Rasa manis lembut dengan body kopi yang tebal — favorit sejuta pelanggan Kopi Mantap.',
    image: '/images/products/kopi-susu-mantap.jpg',
    sizes: [
      { label: 'Regular (250 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Biji Kopi Arabika', image: '/images/ingredients/coffee-beans.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Es Batu', image: '/images/ingredients/ice-cubes.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Panaskan mesin espresso hingga suhu 92°C dan giling biji kopi halus sebanyak 18 gram.',
      'Ekstrak espresso selama 25–30 detik hingga menghasilkan 36 ml shot dengan crema tebal.',
      'Kukus susu segar hingga tekstur microfoam lembut, lalu tuang gula aren cair ke dasar gelas.',
      'Tuang espresso, susu, dan es batu. Aduk perlahan dan sajikan.',
    ],
  },
  {
    name: 'Caramel Latte',
    category: 'Coffee Milk',
    price: 28000,
    featured: 1,
    description:
      'Espresso premium dengan susu steamed dan saus karamel homemade. Manisnya pas, aroma butter caramel-nya bikin nagih sampai tetes terakhir.',
    image: '/images/products/caramel-latte.jpg',
    sizes: [
      { label: 'Regular (240 ml)', extra: 0 },
      { label: 'Large (340 ml)', extra: 6000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Saus Karamel', image: '/images/ingredients/caramel-syrup.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Buat espresso shot ganda dari biji arabika sangrai medium.',
      'Tuang saus karamel ke dasar cangkir, lalu tambahkan espresso panas.',
      'Steam susu hingga 65°C dan tuang perlahan membentuk latte art.',
      'Tambahkan drizzle karamel di atasnya dan sajikan selagi hangat.',
    ],
  },
  {
    name: 'Vanilla Latte',
    category: 'Coffee Milk',
    price: 27000,
    featured: 0,
    description:
      'Latte klasik dengan sirup vanila Bourbon asli. Lembut, wangi, dan seimbang antara pahit kopi dan manis vanila.',
    image: '/images/products/vanilla-latte.jpg',
    sizes: [
      { label: 'Regular (240 ml)', extra: 0 },
      { label: 'Large (340 ml)', extra: 6000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Sirup Vanila', image: '/images/ingredients/vanilla-syrup.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
    ],
    steps: [
      'Siapkan 20 ml sirup vanila di dalam cangkir saji.',
      'Ekstrak espresso 36 ml dan tuang ke atas sirup.',
      'Steam susu hingga microfoam halus, tuang perlahan ke cangkir.',
      'Sajikan panas atau tambahkan es batu untuk versi dingin.',
    ],
  },
  {
    name: 'Hazelnut Coffee Milk',
    category: 'Coffee Milk',
    price: 28000,
    featured: 0,
    description:
      'Kopi susu dengan pasta hazelnut panggang. Aroma kacangnya hangat, cocok untuk pecinta rasa nutty yang creamy.',
    image: '/images/products/hazelnut-coffee-milk.jpg',
    sizes: [
      { label: 'Regular (250 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Biji Kopi Arabika', image: '/images/ingredients/coffee-beans.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Sirup Hazelnut', image: '/images/ingredients/hazelnut-syrup.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
      { name: 'Shaker Es', image: '/images/tools/ice-shaker.jpg' },
    ],
    steps: [
      'Giling 18 gram biji kopi dan ekstrak menjadi double shot.',
      'Campur sirup hazelnut dan susu segar di dalam shaker.',
      'Tambahkan espresso dan es batu, shake selama 10 detik.',
      'Tuang ke gelas saji dan beri topping busa susu.',
    ],
  },
  {
    name: 'Espresso Single Origin',
    category: 'Espresso Based',
    price: 18000,
    featured: 0,
    description:
      'Satu shot pekat dari single origin Gayo, Aceh. Notes cokelat hitam dan rempah dengan aftertaste manis yang panjang.',
    image: '/images/products/espresso-single.jpg',
    sizes: [{ label: 'Single Shot (30 ml)', extra: 0 }],
    temperatures: ['Panas'],
    ingredients: [
      { name: 'Biji Kopi Gayo', image: '/images/ingredients/coffee-beans.jpg' },
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Tamper', image: '/images/tools/tamper.jpg' },
    ],
    steps: [
      'Timbang 18 gram kopi, giling halus, dan padatkan dengan tamper.',
      'Pasang portafilter dan mulai ekstraksi pada tekanan 9 bar.',
      'Hentikan pada 27 detik atau saat volume mencapai 30 ml.',
      'Sajikan segera dalam demitasse hangat.',
    ],
  },
  {
    name: 'Americano',
    category: 'Espresso Based',
    price: 20000,
    featured: 0,
    description:
      'Espresso ganda yang diencerkan dengan air panas atau es. Bersih, ringan, dan menonjolkan karakter biji kopi.',
    image: '/images/products/americano.jpg',
    sizes: [
      { label: 'Regular (240 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 4000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Air Mineral', image: '/images/ingredients/ice-cubes.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Siapkan air panas 180 ml di dalam gelas saji.',
      'Ekstrak double shot espresso dari biji sangrai medium-dark.',
      'Tuang espresso ke atas air agar crema tetap terjaga.',
      'Untuk versi dingin, gunakan es batu dan air mineral dingin.',
    ],
  },
  {
    name: 'Cappuccino',
    category: 'Espresso Based',
    price: 26000,
    featured: 1,
    description:
      'Keseimbangan sempurna espresso, susu, dan busa tebal. Klasik Italia dengan buih susu yang lembut seperti awan.',
    image: '/images/products/cappuccino.jpg',
    sizes: [
      { label: 'Regular (200 ml)', extra: 0 },
      { label: 'Large (300 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Ekstrak espresso 30 ml ke dalam cangkir 200 ml.',
      'Steam susu hingga membentuk busa tebal dan padat.',
      'Tuang susu cair terlebih dahulu, lalu sendok busa di atasnya.',
      'Taburi sedikit bubuk kayu manis bila suka, sajikan hangat.',
    ],
  },
  {
    name: 'Macchiato',
    category: 'Espresso Based',
    price: 25000,
    featured: 0,
    description:
      'Espresso kuat dengan sedikit susu berbusa di atasnya. Untuk kamu yang ingin rasa kopi dominan namun tetap creamy.',
    image: '/images/products/macchiato.jpg',
    sizes: [
      { label: 'Regular (180 ml)', extra: 0 },
      { label: 'Large (280 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Saus Karamel', image: '/images/ingredients/caramel-syrup.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
    ],
    steps: [
      'Ekstrak double shot espresso ke dalam gelas kecil.',
      'Steam sedikit susu hingga berbusa lembut.',
      'Sendok busa susu ke atas espresso, tambahkan drizzle karamel.',
      'Sajikan segera agar crema dan busa masih cantik.',
    ],
  },
  {
    name: 'Butterscotch Coffee',
    category: 'Flavored Coffee',
    price: 30000,
    featured: 1,
    description:
      'Kopi dengan saus butterscotch manis-gurih dan sentuhan sea salt. Perpaduan rasa yang berani dan mewah.',
    image: '/images/products/butterscotch-coffee.jpg',
    sizes: [
      { label: 'Regular (250 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 6000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Saus Butterscotch', image: '/images/ingredients/butterscotch-syrup.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Shaker Es', image: '/images/tools/ice-shaker.jpg' },
    ],
    steps: [
      'Panaskan saus butterscotch bersama susu hingga larut merata.',
      'Ekstrak espresso dan gabungkan dengan campuran susu.',
      'Tambahkan sejumput sea salt untuk menyeimbangkan manisnya.',
      'Sajikan dengan whipped cream bila suka.',
    ],
  },
  {
    name: 'Mocha Cokelat',
    category: 'Flavored Coffee',
    price: 30000,
    featured: 0,
    description:
      'Cokelat Belgia premium bertemu espresso dan susu. Rasa cokelat pekat dengan finish kopi yang elegan.',
    image: '/images/products/mocha-cokelat.jpg',
    sizes: [
      { label: 'Regular (250 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 6000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Espresso Shot', image: '/images/ingredients/espresso-shot.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Saus Cokelat', image: '/images/ingredients/chocolate-sauce.jpg' },
    ],
    tools: [
      { name: 'Mesin Espresso', image: '/images/tools/espresso-machine.jpg' },
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
    ],
    steps: [
      'Lelehkan saus cokelat Belgia dengan sedikit espresso panas.',
      'Tambahkan sisa espresso dan aduk hingga mengental.',
      'Tuang susu steamed dan aduk membentuk pola marmer.',
      'Beri taburan bubuk kakao di atasnya dan sajikan.',
    ],
  },
  {
    name: 'Matcha Latte',
    category: 'Non-Coffee',
    price: 29000,
    featured: 1,
    description:
      'Matcha grade ceremonial dari Uji, Jepang, dikocok bersama susu. Rasa earthy yang lembut dan menenangkan.',
    image: '/images/products/matcha-latte.jpg',
    sizes: [
      { label: 'Regular (240 ml)', extra: 0 },
      { label: 'Large (340 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Bubuk Matcha', image: '/images/ingredients/matcha-powder.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
      { name: 'Es Batu', image: '/images/ingredients/ice-cubes.jpg' },
    ],
    tools: [
      { name: 'Shaker Es', image: '/images/tools/ice-shaker.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Ayak 3 gram matcha ceremonial lalu seduh dengan air 80°C.',
      'Kocok dengan whisk hingga berbusa dan tidak menggumpal.',
      'Tuang susu segar dingin ke gelas berisi es batu.',
      'Tuang matcha di atasnya perlahan untuk efek layer.',
    ],
  },
  {
    name: 'Cokelat Mantap',
    category: 'Non-Coffee',
    price: 25000,
    featured: 0,
    description:
      'Minuman cokelat hangat dari bubuk kakao asli tanpa kopi. Creamy, manis, dan disukai segala usia.',
    image: '/images/products/cokelat-mantap.jpg',
    sizes: [
      { label: 'Regular (250 ml)', extra: 0 },
      { label: 'Large (350 ml)', extra: 5000 },
    ],
    temperatures: ['Panas', 'Dingin'],
    ingredients: [
      { name: 'Saus Cokelat', image: '/images/ingredients/chocolate-sauce.jpg' },
      { name: 'Susu Segar', image: '/images/ingredients/fresh-milk.jpg' },
    ],
    tools: [
      { name: 'Pitcher Susu', image: '/images/tools/milk-pitcher.jpg' },
      { name: 'Gelas Saji', image: '/images/tools/glass-cup.jpg' },
    ],
    steps: [
      'Panaskan susu segar hingga 65°C, jangan sampai mendidih.',
      'Larutkan saus cokelat dengan sedikit susu panas hingga pasta halus.',
      'Campurkan seluruh susu dan aduk hingga berbusa.',
      'Sajikan dengan marshmallow atau whipped cream.',
    ],
  },
];;
