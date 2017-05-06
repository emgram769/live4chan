module.exports = {
    boards: [
        'all', 'g', 'int', 'draw', 'hotel', 'r', 'v', 'pol', 'fit', 'cult',
        's4s', 'dev' /*'a', 'b', 'c', 'd', 'e', 'f', 'film', 'g', 'gif', 'h', 'hr', 'k',
        'm', 'o', 'p', 'r', 's', 't', 'u', 'v', 'vg', 'vr', 'w', 'wg', 'i',
        'ic', 'r9k', 's4s', 'cm', 'hm', 'lgbt', 'y', '3', 'adv', 'an', 'asp',
        'cgl', 'ck', 'co', 'diy', 'fa', 'fit', 'gd', 'hc', 'int', 'jp', 'lit',
        'mlp', 'mu', 'n', 'out', 'po', 'pol', 'sci', 'soc', 'sp', 'tg', 'toy',
        'trv', 'tv', 'vp', 'waifu', 'wsg', 'x', 'dev', 'tech', 'prog',
        'dogecoin', 'fedoracoin', 'coin', 'q', 'cats', 'draw', 'hotel'*/
    ],

    all_fields: 'chat name body convo convo_id count date trip',
    board_fields: 'chat name body convo convo_id count date trip country country_name image image_filename image_filesize image_width image_height duration thumb identifier',

    admin_pw_file: 'admin_pw.txt',
    no_limit_cookie_file: 'no_limit_cookie.txt',
    max_pw_attempts: 10,
    max_pw_attempts_window: 30000,
    securetrip_salt: 'AVEPwfpR4K8PXQaKa4PjXYMGktC2XY4Qt59ZnERsEt5PzAxhyL',
    salt_file: 'salt.txt',

    /* User session expires every 24 hours */
    user_session_age: '24h',

    ssl: {
        ca: 'sub.class1.server.ca.pem',
        key: 'ssl.key',
        cert: 'ssl.crt'
    },

    /* Supported file types */
    image_formats: ['jpg', 'jpeg', 'png', 'gif'],
    video_formats: ['ogv', 'webm', 'mp4'],
    audio_formats: ['ogg', 'mp3', 'flac'],

    codec_names: {
        video: ['theora', 'vp8', 'vp9', 'h264'],
        audio: ['vorbis', 'libopus', 'mp3', "aac", "opus"]
    }
};
