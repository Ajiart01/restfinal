// Dibuat oleh: DanzzCoding | danzzcodingweb.vercel.app

// Modul
let fetch = require('node-fetch')
let { JSDOM } = require('jsdom')

function kirimPost(url, formdata) {
  return fetch(url, {
    method: 'POST',
    headers: {
      accept: "*/*",
      'accept-language': "en-US,en;q=0.9",
      'content-type': "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: new URLSearchParams(Object.entries(formdata))
  })
}
const ytIdRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/

/**
 * Unduh Video YouTube melalui y2mate
 * @param {String} url URL Video YouTube
 * @param {String} kualitas (tersedia: `144p`, `240p`, `360p`, `480p`, `720p`, `1080p`, `1440p`, `2160p`)
 * @param {String} tipe (tersedia: `mp3`, `mp4`)
 * @param {String} bitrate (tersedia untuk video: `144`, `240`, `360`, `480`, `720`, `1080`, `1440`, `2160`)
 * (tersedia untuk audio: `128`)
 * @param {String} server (tersedia: `id4`, `en60`, `en61`, `en68`)
 */
async function yt(url, kualitas, tipe, bitrate, server = 'en68') {
  if (ytIdRegex.test(url)) {
    let ytId = ytIdRegex.exec(url)
    url = 'https://youtu.be/' + ytId[1]
    let res = await kirimPost(`https://www.y2mate.com/mates/${server}/analyze/ajax`, {
      url,
      q_auto: 0,
      ajax: 1
    })
    let json = await res.json()
    let { document } = (new JSDOM(json.result)).window
    let tabels = document.querySelectorAll('table')
    let tabel = tabels[{ mp4: 0, mp3: 1 }[tipe] || 0]
    let daftar
    switch (tipe) {
      case 'mp4':
        daftar = Object.fromEntries([...tabel.querySelectorAll('td > a[href="#"]')].filter(v => !/\.3gp/.test(v.innerHTML)).map(v => [v.innerHTML.match(/.*?(?=\()/)[0].trim(), v.parentElement.nextSibling.nextSibling.innerHTML]))
        break
      case 'mp3':
        daftar = {
          '128kbps': tabel.querySelector('td > a[href="#"]').parentElement.nextSibling.nextSibling.innerHTML
        }
        break
      default:
        daftar = {}
    }
    let ukuranBerkas = daftar[kualitas]
    let id = /var k__id = "(.*?)"/.exec(document.body.innerHTML) || ['', '']
    let thumb = document.querySelector('img').src
    let judul = document.querySelector('b').innerHTML
    let res2 = await kirimPost(`https://www.y2mate.com/mates/${server}/convert`, {
      type: 'youtube',
      _id: id[1],
      v_id: ytId[1],
      ajax: '1',
      token: '',
      ftype: tipe,
      fquality: bitrate
    })
    let json2 = await res2.json()
    let KB = parseFloat(ukuranBerkas) * (1000 * /MB$/.test(ukuranBerkas))
    let resUrl = /<a.+?href="(.+?)"/.exec(json2.result)[1]
    return {
      dl_link: resUrl.replace(/https/g, 'http'),
      thumb,
      judul,
      ukuranBerkasF: ukuranBerkas,
      ukuranBerkas: KB
    }
  } else
    return {
      dl_link: null,
      thumb: null,
      judul: null,
      ukuranBerkasF: null,
      ukuranBerkas: null
    }
}

module.exports = {
  yt,
  ytIdRegex,
  /**
   * Unduh Video YouTube sebagai Audio melalui y2mate
   * @param {String} url URL Video YouTube
   * @param {String} server (tersedia: `id4`, `en60`, `en61`, `en68`)
   */
  yta(url, resol = '128kbps', server = 'en154') { return yt(url, resol, 'mp3', resol.endsWith('kbps') ? resol.replace(/kbps/g, '') : resol, server) },
  /**
   * Unduh Video YouTube sebagai Video melalui y2mate
   * @param {String} url URL Video YouTube
   * @param {String} server (tersedia: `id4`, `en60`, `en61`, `en68`)
   */
  ytv(url, resol = '360p', server = 'en154') { return yt(url, resol, 'mp4', resol.endsWith('p') ? resol.replace(/p/g, '') : resol, server) },
  servers: ['en136', 'id4', 'en60', 'en61', 'en68']
}
