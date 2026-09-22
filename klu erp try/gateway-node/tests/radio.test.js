/**
 * Tests for Radio Station Registry & Broadcaster Service
 */

const test = require('node:test');
const assert = require('node:assert');
const { RADIO_STATIONS, getStationById, getAllStations } = require('../src/services/radio/radio.stations');
const radioBroadcaster = require('../src/services/radio/radio.broadcaster');

test('Radio Stations - lists all official Vice City radio stations', () => {
  const stations = getAllStations();
  assert.ok(stations.length >= 5);

  const weazel = getStationById('weazel-news-247');
  assert.ok(weazel);
  assert.strictEqual(weazel.name, 'Weazel News 24/7');
  assert.strictEqual(weazel.format, 'News / Talk / Propaganda');

  const vcpr = getStationById('vcpr');
  assert.ok(vcpr);
  assert.strictEqual(vcpr.name, 'Vice City Public Radio (VCPR)');
});

test('Radio Broadcaster - creates properly structured bulletin packets', () => {
  const packet = radioBroadcaster.broadcastBulletin(
    'Tanker explosion on Ocean Drive',
    'Weazel News special report: A high-speed pursuit ended in fireworks on Ocean Beach.',
    'weazel-news-247',
    '/audio/bulletins/weazel_tanker.mp3'
  );

  assert.strictEqual(packet.type, 'RADIO_BULLETIN');
  assert.strictEqual(packet.headline, 'Tanker explosion on Ocean Drive');
  assert.strictEqual(packet.station_id, 'weazel-news-247');
  assert.strictEqual(packet.audio_url, '/audio/bulletins/weazel_tanker.mp3');
  assert.ok(typeof packet.bulletin_id === 'string');
  assert.ok(typeof packet.timestamp === 'string');
});
