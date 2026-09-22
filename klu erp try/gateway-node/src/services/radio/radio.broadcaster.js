/**
 * In-Game Live Radio & Bulletin WebSocket Broadcaster
 * Streams breaking news audio/text bulletins to Unreal Engine 5.5 clients.
 * Integrates with Unreal Engine `FOnLiveRadioBulletinReceived` dynamic multicast delegate.
 */

const { WebSocketServer, WebSocket } = require('ws');
const config = require('../../config');
const logger = require('../../utils/logger');
const { RADIO_STATIONS, COMMERCIAL_SPONSORS, DJ_CHATTER, getStationById } = require('./radio.stations');
const newsService = require('../news/news.service');
const { sanitizeText, sanitizePayload } = require('../../utils/sanitizer');

class RadioBroadcaster {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.broadcastTimer = null;
    this.bulletinCounter = 0;
  }

  /**
   * Initialize WebSocket server on existing HTTP server
   * @param {import('http').Server} server
   */
  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/radio-broadcast',
    });

    this.wss.on('connection', (ws, req) => {
      this._handleClientConnection(ws, req);
    });

    // Start automated periodic broadcast generator
    this._startBroadcastLoop();

    logger.info(`Radio Broadcast WebSocket server initialized on path: /ws/radio-broadcast`);
  }

  _handleClientConnection(ws, req) {
    const clientIp = req.socket.remoteAddress;
    this.clients.add(ws);
    logger.info(`Unreal Engine client connected to Radio Broadcast stream from ${clientIp}. Total listeners: ${this.clients.size}`);

    // Attach client metadata
    ws.isAlive = true;
    ws.subscribedStations = ['all'];

    // Send Welcome Packet & Station Directory
    const welcomePacket = {
      type: 'connection_established',
      server_time: new Date().toISOString(),
      message: 'Connected to Vice City Radio Broadcast Network (Eyefind Engine)',
      available_stations: RADIO_STATIONS.map((s) => ({ id: s.id, name: s.name, genre: s.genre, dj: s.dj })),
    };
    ws.send(JSON.stringify(sanitizePayload(welcomePacket)));

    // Handle incoming client messages (e.g. subscribe to specific stations or send ping)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'subscribe' && Array.isArray(data.stations)) {
          ws.subscribedStations = data.stations;
          ws.send(JSON.stringify({ type: 'subscription_updated', stations: ws.subscribedStations }));
        }
      } catch {
        // Ignore malformed client frames
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info(`Client disconnected from Radio Broadcast stream. Remaining listeners: ${this.clients.size}`);
    });

    ws.on('error', (err) => {
      logger.warn(`WebSocket client error: ${err.message}`);
      this.clients.delete(ws);
    });
  }

  /**
   * Broadcast a breaking news bulletin to all connected game engine clients
   * @param {string} headline - Bulletin headline
   * @param {string} script - Spoken radio script
   * @param {string} stationId - Target station or 'all'
   * @param {string} customAudioUrl - Optional audio asset URL
   */
  broadcastBulletin(headline, script, stationId = 'all', customAudioUrl = null) {
    this.bulletinCounter++;
    const bulletinId = `bulletin-${Date.now()}-${this.bulletinCounter}`;
    const audioUrl = customAudioUrl || `${config.radio.audioCdnUrl}/bulletins/${bulletinId}.mp3`;

    const station = getStationById(stationId) || RADIO_STATIONS[0];
    const resolvedStationId = stationId !== 'all' ? stationId : station.id;

    const packet = {
      type: 'RADIO_BULLETIN',
      bulletin_id: bulletinId,
      id: bulletinId,
      station: station.name,
      station_id: resolvedStationId,
      headline: sanitizeText(headline, config.safety.maxTitleLength),
      script: sanitizeText(script, config.safety.maxSnippetLength),
      dj_name: station.dj,
      audio_url: audioUrl,
      timestamp: new Date().toISOString(),
      severity: 'breaking',
    };

    this._sendToSubscribers(packet, stationId);
    logger.info(`[Radio Broadcast] Sent breaking bulletin: "${headline}" across station [${station.name}]`);
    return packet;
  }

  /**
   * Broadcast a commercial advertisement
   */
  broadcastCommercial(sponsorIndex = -1) {
    const sponsor = sponsorIndex >= 0 && sponsorIndex < COMMERCIAL_SPONSORS.length
      ? COMMERCIAL_SPONSORS[sponsorIndex]
      : COMMERCIAL_SPONSORS[Math.floor(Math.random() * COMMERCIAL_SPONSORS.length)];

    const packet = {
      type: 'commercial',
      product: sanitizeText(sponsor.product, 64),
      slogan: sanitizeText(sponsor.slogan, 128),
      script: sanitizeText(sponsor.script, config.safety.maxSnippetLength),
      audio_url: `${config.radio.audioCdnUrl}/commercials/${encodeURIComponent(sponsor.product.toLowerCase().replace(/\s+/g, '_'))}.mp3`,
      timestamp: new Date().toISOString(),
    };

    this._sendToSubscribers(packet, 'all');
    logger.debug(`[Radio Commercial] Broadcasted ad for: ${sponsor.product}`);
    return packet;
  }

  /**
   * Broadcast DJ chatter
   */
  broadcastDJChatter() {
    const chatter = DJ_CHATTER[Math.floor(Math.random() * DJ_CHATTER.length)];
    const packet = {
      type: 'dj_chatter',
      station: chatter.station,
      dj_name: chatter.dj,
      script: sanitizeText(chatter.script, config.safety.maxSnippetLength),
      audio_url: `${config.radio.audioCdnUrl}/chatter/${chatter.dj.toLowerCase().replace(/\s+/g, '_')}.mp3`,
      timestamp: new Date().toISOString(),
    };

    this._sendToSubscribers(packet, 'all');
    return packet;
  }

  _sendToSubscribers(packet, targetStationId) {
    if (this.clients.size === 0) return;

    const payloadString = JSON.stringify(sanitizePayload(packet));

    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        if (
          targetStationId === 'all' ||
          ws.subscribedStations.includes('all') ||
          ws.subscribedStations.includes(targetStationId)
        ) {
          ws.send(payloadString);
        }
      }
    }
  }

  /**
   * Periodic broadcast ticker (alternates between breaking news, DJ banter, and commercials)
   */
  _startBroadcastLoop() {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);

    let state = 0;
    this.broadcastTimer = setInterval(async () => {
      if (this.clients.size === 0) return;

      try {
        if (state === 0) {
          // Send Breaking News Flash
          const trending = await newsService.getTrendingNews();
          if (trending && trending.trending_news && trending.trending_news.length > 0) {
            const item = trending.trending_news[Math.floor(Math.random() * trending.trending_news.length)];
            this.broadcastBulletin(
              item.headline,
              item.body,
              'weazel-news-247',
              item.satirical_audio_url
            );
          }
          state = 1;
        } else if (state === 1) {
          // Send DJ banter
          this.broadcastDJChatter();
          state = 2;
        } else {
          // Send Commercial Sponsor
          this.broadcastCommercial();
          state = 0;
        }
      } catch (err) {
        logger.warn(`Radio loop broadcast error: ${err.message}`);
      }
    }, config.radio.broadcastIntervalMs);

    if (this.broadcastTimer && typeof this.broadcastTimer.unref === 'function') {
      this.broadcastTimer.unref();
    }
  }

  /**
   * Shutdown WebSocket server cleanly
   */
  shutdown() {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.wss) {
      for (const ws of this.clients) {
        ws.close(1001, 'Gateway shutting down');
      }
      this.wss.close();
    }
    logger.info('Radio Broadcaster WebSocket server closed.');
  }
}

module.exports = new RadioBroadcaster();
