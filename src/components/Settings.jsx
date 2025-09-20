import React, { useState, useEffect } from 'react';
import { Save, Clock, Globe, Settings as SettingsIcon, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    default_timezone: 'UTC',
    api_key: '',
    other_settings: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timezones, setTimezones] = useState([]);

  // WordPress timezone options
  const wordpressTimezones = {
    'Africa/Abidjan': 'Africa - Abidjan',
    'Africa/Accra': 'Africa - Accra',
    'Africa/Addis_Ababa': 'Africa - Addis Ababa',
    'Africa/Algiers': 'Africa - Algiers',
    'Africa/Asmara': 'Africa - Asmara',
    'Africa/Bamako': 'Africa - Bamako',
    'Africa/Bangui': 'Africa - Bangui',
    'Africa/Banjul': 'Africa - Banjul',
    'Africa/Bissau': 'Africa - Bissau',
    'Africa/Blantyre': 'Africa - Blantyre',
    'Africa/Brazzaville': 'Africa - Brazzaville',
    'Africa/Bujumbura': 'Africa - Bujumbura',
    'Africa/Cairo': 'Africa - Cairo',
    'Africa/Casablanca': 'Africa - Casablanca',
    'Africa/Ceuta': 'Africa - Ceuta',
    'Africa/Conakry': 'Africa - Conakry',
    'Africa/Dakar': 'Africa - Dakar',
    'Africa/Dar_es_Salaam': 'Africa - Dar es Salaam',
    'Africa/Djibouti': 'Africa - Djibouti',
    'Africa/Douala': 'Africa - Douala',
    'Africa/El_Aaiun': 'Africa - El Aaiun',
    'Africa/Freetown': 'Africa - Freetown',
    'Africa/Gaborone': 'Africa - Gaborone',
    'Africa/Harare': 'Africa - Harare',
    'Africa/Johannesburg': 'Africa - Johannesburg',
    'Africa/Juba': 'Africa - Juba',
    'Africa/Kampala': 'Africa - Kampala',
    'Africa/Khartoum': 'Africa - Khartoum',
    'Africa/Kigali': 'Africa - Kigali',
    'Africa/Kinshasa': 'Africa - Kinshasa',
    'Africa/Lagos': 'Africa - Lagos',
    'Africa/Libreville': 'Africa - Libreville',
    'Africa/Lome': 'Africa - Lome',
    'Africa/Luanda': 'Africa - Luanda',
    'Africa/Lubumbashi': 'Africa - Lubumbashi',
    'Africa/Lusaka': 'Africa - Lusaka',
    'Africa/Malabo': 'Africa - Malabo',
    'Africa/Maputo': 'Africa - Maputo',
    'Africa/Maseru': 'Africa - Maseru',
    'Africa/Mbabane': 'Africa - Mbabane',
    'Africa/Mogadishu': 'Africa - Mogadishu',
    'Africa/Monrovia': 'Africa - Monrovia',
    'Africa/Nairobi': 'Africa - Nairobi',
    'Africa/Ndjamena': 'Africa - Ndjamena',
    'Africa/Niamey': 'Africa - Niamey',
    'Africa/Nouakchott': 'Africa - Nouakchott',
    'Africa/Ouagadougou': 'Africa - Ouagadougou',
    'Africa/Porto-Novo': 'Africa - Porto-Novo',
    'Africa/Sao_Tome': 'Africa - Sao Tome',
    'Africa/Tripoli': 'Africa - Tripoli',
    'Africa/Tunis': 'Africa - Tunis',
    'Africa/Windhoek': 'Africa - Windhoek',
    'America/Adak': 'America - Adak',
    'America/Anchorage': 'America - Anchorage',
    'America/Anguilla': 'America - Anguilla',
    'America/Antigua': 'America - Antigua',
    'America/Araguaina': 'America - Araguaina',
    'America/Argentina/Buenos_Aires': 'America/Argentina - Buenos Aires',
    'America/Argentina/Catamarca': 'America/Argentina - Catamarca',
    'America/Argentina/Cordoba': 'America/Argentina - Cordoba',
    'America/Argentina/Jujuy': 'America/Argentina - Jujuy',
    'America/Argentina/La_Rioja': 'America/Argentina - La Rioja',
    'America/Argentina/Mendoza': 'America/Argentina - Mendoza',
    'America/Argentina/Rio_Gallegos': 'America/Argentina - Rio Gallegos',
    'America/Argentina/Salta': 'America/Argentina - Salta',
    'America/Argentina/San_Juan': 'America/Argentina - San Juan',
    'America/Argentina/San_Luis': 'America/Argentina - San Luis',
    'America/Argentina/Tucuman': 'America/Argentina - Tucuman',
    'America/Argentina/Ushuaia': 'America/Argentina - Ushuaia',
    'America/Aruba': 'America - Aruba',
    'America/Asuncion': 'America - Asuncion',
    'America/Atikokan': 'America - Atikokan',
    'America/Bahia': 'America - Bahia',
    'America/Bahia_Banderas': 'America - Bahia Banderas',
    'America/Barbados': 'America - Barbados',
    'America/Belem': 'America - Belem',
    'America/Belize': 'America - Belize',
    'America/Blanc-Sablon': 'America - Blanc-Sablon',
    'America/Boa_Vista': 'America - Boa Vista',
    'America/Bogota': 'America - Bogota',
    'America/Boise': 'America - Boise',
    'America/Cambridge_Bay': 'America - Cambridge Bay',
    'America/Campo_Grande': 'America - Campo Grande',
    'America/Cancun': 'America - Cancun',
    'America/Caracas': 'America - Caracas',
    'America/Cayenne': 'America - Cayenne',
    'America/Cayman': 'America - Cayman',
    'America/Chicago': 'America - Chicago',
    'America/Chihuahua': 'America - Chihuahua',
    'America/Costa_Rica': 'America - Costa Rica',
    'America/Creston': 'America - Creston',
    'America/Cuiaba': 'America - Cuiaba',
    'America/Curacao': 'America - Curacao',
    'America/Danmarkshavn': 'America - Danmarkshavn',
    'America/Dawson': 'America - Dawson',
    'America/Dawson_Creek': 'America - Dawson Creek',
    'America/Denver': 'America - Denver',
    'America/Detroit': 'America - Detroit',
    'America/Dominica': 'America - Dominica',
    'America/Edmonton': 'America - Edmonton',
    'America/Eirunepe': 'America - Eirunepe',
    'America/El_Salvador': 'America - El Salvador',
    'America/Fort_Nelson': 'America - Fort Nelson',
    'America/Fortaleza': 'America - Fortaleza',
    'America/Glace_Bay': 'America - Glace Bay',
    'America/Goose_Bay': 'America - Goose Bay',
    'America/Grand_Turk': 'America - Grand Turk',
    'America/Grenada': 'America - Grenada',
    'America/Guadeloupe': 'America - Guadeloupe',
    'America/Guatemala': 'America - Guatemala',
    'America/Guayaquil': 'America - Guayaquil',
    'America/Guyana': 'America - Guyana',
    'America/Halifax': 'America - Halifax',
    'America/Havana': 'America - Havana',
    'America/Hermosillo': 'America - Hermosillo',
    'America/Indiana/Indianapolis': 'America/Indiana - Indianapolis',
    'America/Indiana/Knox': 'America/Indiana - Knox',
    'America/Indiana/Marengo': 'America/Indiana - Marengo',
    'America/Indiana/Petersburg': 'America/Indiana - Petersburg',
    'America/Indiana/Tell_City': 'America/Indiana - Tell City',
    'America/Indiana/Vevay': 'America/Indiana - Vevay',
    'America/Indiana/Vincennes': 'America/Indiana - Vincennes',
    'America/Indiana/Winamac': 'America/Indiana - Winamac',
    'America/Inuvik': 'America - Inuvik',
    'America/Iqaluit': 'America - Iqaluit',
    'America/Jamaica': 'America - Jamaica',
    'America/Juneau': 'America - Juneau',
    'America/Kentucky/Louisville': 'America/Kentucky - Louisville',
    'America/Kentucky/Monticello': 'America/Kentucky - Monticello',
    'America/Kralendijk': 'America - Kralendijk',
    'America/La_Paz': 'America - La Paz',
    'America/Lima': 'America - Lima',
    'America/Los_Angeles': 'America - Los Angeles',
    'America/Lower_Princes': 'America - Lower Princes',
    'America/Maceio': 'America - Maceio',
    'America/Managua': 'America - Managua',
    'America/Manaus': 'America - Manaus',
    'America/Marigot': 'America - Marigot',
    'America/Martinique': 'America - Martinique',
    'America/Matamoros': 'America - Matamoros',
    'America/Mazatlan': 'America - Mazatlan',
    'America/Menominee': 'America - Menominee',
    'America/Merida': 'America - Merida',
    'America/Metlakatla': 'America - Metlakatla',
    'America/Mexico_City': 'America - Mexico City',
    'America/Miquelon': 'America - Miquelon',
    'America/Moncton': 'America - Moncton',
    'America/Monterrey': 'America - Monterrey',
    'America/Montevideo': 'America - Montevideo',
    'America/Montserrat': 'America - Montserrat',
    'America/Nassau': 'America - Nassau',
    'America/New_York': 'America - New York',
    'America/Nipigon': 'America - Nipigon',
    'America/Nome': 'America - Nome',
    'America/Noronha': 'America - Noronha',
    'America/North_Dakota/Beulah': 'America/North_Dakota - Beulah',
    'America/North_Dakota/Center': 'America/North_Dakota - Center',
    'America/North_Dakota/New_Salem': 'America/North_Dakota - New Salem',
    'America/Ojinaga': 'America - Ojinaga',
    'America/Panama': 'America - Panama',
    'America/Pangnirtung': 'America - Pangnirtung',
    'America/Paramaribo': 'America - Paramaribo',
    'America/Phoenix': 'America - Phoenix',
    'America/Port-au-Prince': 'America - Port-au-Prince',
    'America/Port_of_Spain': 'America - Port of Spain',
    'America/Porto_Velho': 'America - Porto Velho',
    'America/Puerto_Rico': 'America - Puerto Rico',
    'America/Punta_Arenas': 'America - Punta Arenas',
    'America/Rainy_River': 'America - Rainy River',
    'America/Rankin_Inlet': 'America - Rankin Inlet',
    'America/Recife': 'America - Recife',
    'America/Regina': 'America - Regina',
    'America/Resolute': 'America - Resolute',
    'America/Rio_Branco': 'America - Rio Branco',
    'America/Santarem': 'America - Santarem',
    'America/Santiago': 'America - Santiago',
    'America/Santo_Domingo': 'America - Santo Domingo',
    'America/Sao_Paulo': 'America - Sao Paulo',
    'America/Scoresbysund': 'America - Scoresbysund',
    'America/Sitka': 'America - Sitka',
    'America/St_Barthelemy': 'America - St. Barthelemy',
    'America/St_Johns': 'America - St. Johns',
    'America/St_Kitts': 'America - St. Kitts',
    'America/St_Lucia': 'America - St. Lucia',
    'America/St_Thomas': 'America - St. Thomas',
    'America/St_Vincent': 'America - St. Vincent',
    'America/Swift_Current': 'America - Swift Current',
    'America/Tegucigalpa': 'America - Tegucigalpa',
    'America/Thule': 'America - Thule',
    'America/Thunder_Bay': 'America - Thunder Bay',
    'America/Tijuana': 'America - Tijuana',
    'America/Toronto': 'America - Toronto',
    'America/Tortola': 'America - Tortola',
    'America/Vancouver': 'America - Vancouver',
    'America/Whitehorse': 'America - Whitehorse',
    'America/Winnipeg': 'America - Winnipeg',
    'America/Yakutat': 'America - Yakutat',
    'America/Yellowknife': 'America - Yellowknife',
    'Antarctica/Casey': 'Antarctica - Casey',
    'Antarctica/Davis': 'Antarctica - Davis',
    'Antarctica/DumontDUrville': 'Antarctica - DumontDUrville',
    'Antarctica/Macquarie': 'Antarctica - Macquarie',
    'Antarctica/Mawson': 'Antarctica - Mawson',
    'Antarctica/McMurdo': 'Antarctica - McMurdo',
    'Antarctica/Palmer': 'Antarctica - Palmer',
    'Antarctica/Rothera': 'Antarctica - Rothera',
    'Antarctica/Syowa': 'Antarctica - Syowa',
    'Antarctica/Troll': 'Antarctica - Troll',
    'Antarctica/Vostok': 'Antarctica - Vostok',
    'Arctic/Longyearbyen': 'Arctic - Longyearbyen',
    'Asia/Aden': 'Asia - Aden',
    'Asia/Almaty': 'Asia - Almaty',
    'Asia/Amman': 'Asia - Amman',
    'Asia/Anadyr': 'Asia - Anadyr',
    'Asia/Aqtau': 'Asia - Aqtau',
    'Asia/Aqtobe': 'Asia - Aqtobe',
    'Asia/Ashgabat': 'Asia - Ashgabat',
    'Asia/Atyrau': 'Asia - Atyrau',
    'Asia/Baghdad': 'Asia - Baghdad',
    'Asia/Bahrain': 'Asia - Bahrain',
    'Asia/Baku': 'Asia - Baku',
    'Asia/Bangkok': 'Asia - Bangkok',
    'Asia/Barnaul': 'Asia - Barnaul',
    'Asia/Beirut': 'Asia - Beirut',
    'Asia/Bishkek': 'Asia - Bishkek',
    'Asia/Brunei': 'Asia - Brunei',
    'Asia/Chita': 'Asia - Chita',
    'Asia/Choibalsan': 'Asia - Choibalsan',
    'Asia/Colombo': 'Asia - Colombo',
    'Asia/Damascus': 'Asia - Damascus',
    'Asia/Dhaka': 'Asia - Dhaka',
    'Asia/Dili': 'Asia - Dili',
    'Asia/Dubai': 'Asia - Dubai',
    'Asia/Dushanbe': 'Asia - Dushanbe',
    'Asia/Famagusta': 'Asia - Famagusta',
    'Asia/Gaza': 'Asia - Gaza',
    'Asia/Hebron': 'Asia - Hebron',
    'Asia/Ho_Chi_Minh': 'Asia - Ho Chi Minh',
    'Asia/Hong_Kong': 'Asia - Hong Kong',
    'Asia/Hovd': 'Asia - Hovd',
    'Asia/Irkutsk': 'Asia - Irkutsk',
    'Asia/Istanbul': 'Asia - Istanbul',
    'Asia/Jakarta': 'Asia - Jakarta',
    'Asia/Jayapura': 'Asia - Jayapura',
    'Asia/Jerusalem': 'Asia - Jerusalem',
    'Asia/Kabul': 'Asia - Kabul',
    'Asia/Kamchatka': 'Asia - Kamchatka',
    'Asia/Karachi': 'Asia - Karachi',
    'Asia/Kathmandu': 'Asia - Kathmandu',
    'Asia/Khandyga': 'Asia - Khandyga',
    'Asia/Kolkata': 'Asia - Kolkata',
    'Asia/Krasnoyarsk': 'Asia - Krasnoyarsk',
    'Asia/Kuala_Lumpur': 'Asia - Kuala Lumpur',
    'Asia/Kuching': 'Asia - Kuching',
    'Asia/Kuwait': 'Asia - Kuwait',
    'Asia/Macau': 'Asia - Macau',
    'Asia/Magadan': 'Asia - Magadan',
    'Asia/Makassar': 'Asia - Makassar',
    'Asia/Manila': 'Asia - Manila',
    'Asia/Muscat': 'Asia - Muscat',
    'Asia/Nicosia': 'Asia - Nicosia',
    'Asia/Novokuznetsk': 'Asia - Novokuznetsk',
    'Asia/Novosibirsk': 'Asia - Novosibirsk',
    'Asia/Omsk': 'Asia - Omsk',
    'Asia/Oral': 'Asia - Oral',
    'Asia/Phnom_Penh': 'Asia - Phnom Penh',
    'Asia/Pontianak': 'Asia - Pontianak',
    'Asia/Pyongyang': 'Asia - Pyongyang',
    'Asia/Qatar': 'Asia - Qatar',
    'Asia/Qostanay': 'Asia - Qostanay',
    'Asia/Qyzylorda': 'Asia - Qyzylorda',
    'Asia/Riyadh': 'Asia - Riyadh',
    'Asia/Sakhalin': 'Asia - Sakhalin',
    'Asia/Samarkand': 'Asia - Samarkand',
    'Asia/Seoul': 'Asia - Seoul',
    'Asia/Shanghai': 'Asia - Shanghai',
    'Asia/Singapore': 'Asia - Singapore',
    'Asia/Srednekolymsk': 'Asia - Srednekolymsk',
    'Asia/Taipei': 'Asia - Taipei',
    'Asia/Tashkent': 'Asia - Tashkent',
    'Asia/Tbilisi': 'Asia - Tbilisi',
    'Asia/Tehran': 'Asia - Tehran',
    'Asia/Thimphu': 'Asia - Thimphu',
    'Asia/Tokyo': 'Asia - Tokyo',
    'Asia/Tomsk': 'Asia - Tomsk',
    'Asia/Ulaanbaatar': 'Asia - Ulaanbaatar',
    'Asia/Urumqi': 'Asia - Urumqi',
    'Asia/Ust-Nera': 'Asia - Ust-Nera',
    'Asia/Vientiane': 'Asia - Vientiane',
    'Asia/Vladivostok': 'Asia - Vladivostok',
    'Asia/Yakutsk': 'Asia - Yakutsk',
    'Asia/Yangon': 'Asia - Yangon',
    'Asia/Yekaterinburg': 'Asia - Yekaterinburg',
    'Asia/Yerevan': 'Asia - Yerevan',
    'Atlantic/Azores': 'Atlantic - Azores',
    'Atlantic/Bermuda': 'Atlantic - Bermuda',
    'Atlantic/Canary': 'Atlantic - Canary',
    'Atlantic/Cape_Verde': 'Atlantic - Cape Verde',
    'Atlantic/Faroe': 'Atlantic - Faroe',
    'Atlantic/Madeira': 'Atlantic - Madeira',
    'Atlantic/Reykjavik': 'Atlantic - Reykjavik',
    'Atlantic/South_Georgia': 'Atlantic - South Georgia',
    'Atlantic/St_Helena': 'Atlantic - St. Helena',
    'Atlantic/Stanley': 'Atlantic - Stanley',
    'Australia/Adelaide': 'Australia - Adelaide',
    'Australia/Brisbane': 'Australia - Brisbane',
    'Australia/Broken_Hill': 'Australia - Broken Hill',
    'Australia/Currie': 'Australia - Currie',
    'Australia/Darwin': 'Australia - Darwin',
    'Australia/Eucla': 'Australia - Eucla',
    'Australia/Hobart': 'Australia - Hobart',
    'Australia/Lindeman': 'Australia - Lindeman',
    'Australia/Lord_Howe': 'Australia - Lord Howe',
    'Australia/Melbourne': 'Australia - Melbourne',
    'Australia/Perth': 'Australia - Perth',
    'Australia/Sydney': 'Australia - Sydney',
    'Europe/Amsterdam': 'Europe - Amsterdam',
    'Europe/Andorra': 'Europe - Andorra',
    'Europe/Astrakhan': 'Europe - Astrakhan',
    'Europe/Athens': 'Europe - Athens',
    'Europe/Belgrade': 'Europe - Belgrade',
    'Europe/Berlin': 'Europe - Berlin',
    'Europe/Bratislava': 'Europe - Bratislava',
    'Europe/Brussels': 'Europe - Brussels',
    'Europe/Bucharest': 'Europe - Bucharest',
    'Europe/Budapest': 'Europe - Budapest',
    'Europe/Busingen': 'Europe - Busingen',
    'Europe/Chisinau': 'Europe - Chisinau',
    'Europe/Copenhagen': 'Europe - Copenhagen',
    'Europe/Dublin': 'Europe - Dublin',
    'Europe/Gibraltar': 'Europe - Gibraltar',
    'Europe/Guernsey': 'Europe - Guernsey',
    'Europe/Helsinki': 'Europe - Helsinki',
    'Europe/Isle_of_Man': 'Europe - Isle of Man',
    'Europe/Istanbul': 'Europe - Istanbul',
    'Europe/Jersey': 'Europe - Jersey',
    'Europe/Kaliningrad': 'Europe - Kaliningrad',
    'Europe/Kiev': 'Europe - Kiev',
    'Europe/Kirov': 'Europe - Kirov',
    'Europe/Lisbon': 'Europe - Lisbon',
    'Europe/Ljubljana': 'Europe - Ljubljana',
    'Europe/London': 'Europe - London',
    'Europe/Luxembourg': 'Europe - Luxembourg',
    'Europe/Madrid': 'Europe - Madrid',
    'Europe/Malta': 'Europe - Malta',
    'Europe/Mariehamn': 'Europe - Mariehamn',
    'Europe/Minsk': 'Europe - Minsk',
    'Europe/Monaco': 'Europe - Monaco',
    'Europe/Moscow': 'Europe - Moscow',
    'Europe/Oslo': 'Europe - Oslo',
    'Europe/Paris': 'Europe - Paris',
    'Europe/Podgorica': 'Europe - Podgorica',
    'Europe/Prague': 'Europe - Prague',
    'Europe/Riga': 'Europe - Riga',
    'Europe/Rome': 'Europe - Rome',
    'Europe/Samara': 'Europe - Samara',
    'Europe/San_Marino': 'Europe - San Marino',
    'Europe/Sarajevo': 'Europe - Sarajevo',
    'Europe/Saratov': 'Europe - Saratov',
    'Europe/Simferopol': 'Europe - Simferopol',
    'Europe/Skopje': 'Europe - Skopje',
    'Europe/Sofia': 'Europe - Sofia',
    'Europe/Stockholm': 'Europe - Stockholm',
    'Europe/Tallinn': 'Europe - Tallinn',
    'Europe/Tirane': 'Europe - Tirane',
    'Europe/Ulyanovsk': 'Europe - Ulyanovsk',
    'Europe/Uzhgorod': 'Europe - Uzhgorod',
    'Europe/Vaduz': 'Europe - Vaduz',
    'Europe/Vatican': 'Europe - Vatican',
    'Europe/Vienna': 'Europe - Vienna',
    'Europe/Vilnius': 'Europe - Vilnius',
    'Europe/Volgograd': 'Europe - Volgograd',
    'Europe/Warsaw': 'Europe - Warsaw',
    'Europe/Zagreb': 'Europe - Zagreb',
    'Europe/Zaporozhye': 'Europe - Zaporozhye',
    'Europe/Zurich': 'Europe - Zurich',
    'Indian/Antananarivo': 'Indian - Antananarivo',
    'Indian/Chagos': 'Indian - Chagos',
    'Indian/Christmas': 'Indian - Christmas',
    'Indian/Cocos': 'Indian - Cocos',
    'Indian/Comoro': 'Indian - Comoro',
    'Indian/Kerguelen': 'Indian - Kerguelen',
    'Indian/Mahe': 'Indian - Mahe',
    'Indian/Maldives': 'Indian - Maldives',
    'Indian/Mauritius': 'Indian - Mauritius',
    'Indian/Mayotte': 'Indian - Mayotte',
    'Indian/Reunion': 'Indian - Reunion',
    'Pacific/Apia': 'Pacific - Apia',
    'Pacific/Auckland': 'Pacific - Auckland',
    'Pacific/Bougainville': 'Pacific - Bougainville',
    'Pacific/Chatham': 'Pacific - Chatham',
    'Pacific/Chuuk': 'Pacific - Chuuk',
    'Pacific/Easter': 'Pacific - Easter',
    'Pacific/Efate': 'Pacific - Efate',
    'Pacific/Fakaofo': 'Pacific - Fakaofo',
    'Pacific/Fiji': 'Pacific - Fiji',
    'Pacific/Funafuti': 'Pacific - Funafuti',
    'Pacific/Galapagos': 'Pacific - Galapagos',
    'Pacific/Gambier': 'Pacific - Gambier',
    'Pacific/Guadalcanal': 'Pacific - Guadalcanal',
    'Pacific/Guam': 'Pacific - Guam',
    'Pacific/Honolulu': 'Pacific - Honolulu',
    'Pacific/Kiritimati': 'Pacific - Kiritimati',
    'Pacific/Kosrae': 'Pacific - Kosrae',
    'Pacific/Kwajalein': 'Pacific - Kwajalein',
    'Pacific/Majuro': 'Pacific - Majuro',
    'Pacific/Marquesas': 'Pacific - Marquesas',
    'Pacific/Midway': 'Pacific - Midway',
    'Pacific/Nauru': 'Pacific - Nauru',
    'Pacific/Niue': 'Pacific - Niue',
    'Pacific/Norfolk': 'Pacific - Norfolk',
    'Pacific/Noumea': 'Pacific - Noumea',
    'Pacific/Pago_Pago': 'Pacific - Pago Pago',
    'Pacific/Palau': 'Pacific - Palau',
    'Pacific/Pitcairn': 'Pacific - Pitcairn',
    'Pacific/Pohnpei': 'Pacific - Pohnpei',
    'Pacific/Port_Moresby': 'Pacific - Port Moresby',
    'Pacific/Rarotonga': 'Pacific - Rarotonga',
    'Pacific/Saipan': 'Pacific - Saipan',
    'Pacific/Tahiti': 'Pacific - Tahiti',
    'Pacific/Tarawa': 'Pacific - Tarawa',
    'Pacific/Tongatapu': 'Pacific - Tongatapu',
    'Pacific/Wake': 'Pacific - Wake',
    'Pacific/Wallis': 'Pacific - Wallis',
    'UTC-12': 'UTC-12',
    'UTC-11': 'UTC-11',
    'UTC-10': 'UTC-10',
    'UTC-9.5': 'UTC-9:30',
    'UTC-9': 'UTC-9',
    'UTC-8.5': 'UTC-8:30',
    'UTC-8': 'UTC-8',
    'UTC-7': 'UTC-7',
    'UTC-6': 'UTC-6',
    'UTC-5': 'UTC-5',
    'UTC-4.5': 'UTC-4:30',
    'UTC-4': 'UTC-4',
    'UTC-3.5': 'UTC-3:30',
    'UTC-3': 'UTC-3',
    'UTC-2': 'UTC-2',
    'UTC-1': 'UTC-1',
    'UTC': 'UTC',
    'UTC+1': 'UTC+1',
    'UTC+2': 'UTC+2',
    'UTC+3': 'UTC+3',
    'UTC+3.5': 'UTC+3:30',
    'UTC+4': 'UTC+4',
    'UTC+4.5': 'UTC+4:30',
    'UTC+5': 'UTC+5',
    'UTC+5.5': 'UTC+5:30',
    'UTC+5.75': 'UTC+5:45',
    'UTC+6': 'UTC+6',
    'UTC+6.5': 'UTC+6:30',
    'UTC+7': 'UTC+7',
    'UTC+8': 'UTC+8',
    'UTC+8.5': 'UTC+8:30',
    'UTC+8.75': 'UTC+8:45',
    'UTC+9': 'UTC+9',
    'UTC+9.5': 'UTC+9:30',
    'UTC+10': 'UTC+10',
    'UTC+10.5': 'UTC+10:30',
    'UTC+11': 'UTC+11',
    'UTC+12': 'UTC+12',
    'UTC+12.75': 'UTC+12:45',
    'UTC+13': 'UTC+13',
    'UTC+13.75': 'UTC+13:45',
    'UTC+14': 'UTC+14'
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings via AJAX
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_settings',
          nonce: cccData.nonce
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_save_settings',
          nonce: cccData.nonce,
          settings: JSON.stringify(settings)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Settings saved successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
          setMessage({ type: 'error', text: data.data || 'Failed to save settings' });
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Plugin Settings</h1>
              <p className="text-sm text-gray-600">Configure global settings for Custom Craft Component</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-md flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="p-6 space-y-6">
          {/* Default Timezone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Default Timezone</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set the default timezone for all date and datetime fields. This will be used when no specific timezone is configured for individual fields.
            </p>
            
            <div className="max-w-md">
              <select
                value={settings.default_timezone}
                onChange={(e) => handleSettingChange('default_timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(wordpressTimezones).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Future Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
            </div>
            <p className="text-sm text-gray-600">
              More settings will be added here in future updates.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
