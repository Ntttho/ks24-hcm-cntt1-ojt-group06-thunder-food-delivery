import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_CHAT_REPLIES,
  buildLocationQuery,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  getDeliveryStageInfo,
  createDriverChatMessage,
  loadOrderChatMessages,
  saveOrderChatMessages,
} from './deliveryHelpers.ts';

test('buildLocationQuery prefers valid coordinates and falls back to address', () => {
  assert.equal(
    buildLocationQuery(10.7769, 106.7009, '123 Lê Lợi, Q1'),
    '10.7769,106.7009'
  );
  assert.equal(buildLocationQuery(null, null, '  123 Lê Lợi, Q1  '), '123 Lê Lợi, Q1');
  assert.equal(buildLocationQuery(0, 0, '45 Nguyễn Huệ'), '45 Nguyễn Huệ');
});

test('buildGoogleMapsDirectionsUrl constructs two-wheeler navigation links', () => {
  const pickupUrl = buildGoogleMapsDirectionsUrl({
    destinationLat: 10.77,
    destinationLng: 106.69,
    destinationAddress: 'Quán Phở',
  });
  assert.match(pickupUrl, /^https:\/\/www\.google\.com\/maps\/dir\/\?/);
  assert.match(pickupUrl, /destination=10\.77%2C106\.69/);
  assert.match(pickupUrl, /travelmode=two-wheeler/);

  const routeUrl = buildGoogleMapsDirectionsUrl({
    originAddress: 'Quán A',
    destinationAddress: 'Nhà B',
  });
  assert.match(routeUrl, /origin=Qu%C3%A1n\+A/);
  assert.match(routeUrl, /destination=Nh%C3%A0\+B/);
});

test('buildGoogleMapsEmbedUrl generates pickup, dropoff, and route embeds', () => {
  const pickupEmbed = buildGoogleMapsEmbedUrl({
    mode: 'pickup',
    pickupLat: 10.7769,
    pickupLng: 106.7009,
    dropoffAddress: 'Khách Q3',
  });
  assert.ok(pickupEmbed?.includes('q=10.7769%2C106.7009'));
  assert.ok(pickupEmbed?.includes('output=embed'));

  const routeEmbed = buildGoogleMapsEmbedUrl({
    mode: 'route',
    pickupAddress: 'Quán 1',
    dropoffAddress: 'Khách 2',
  });
  assert.ok(routeEmbed?.includes('saddr=Qu%C3%A1n%201'));
  assert.ok(routeEmbed?.includes('daddr=Kh%C3%A1ch%202'));

  const emptyEmbed = buildGoogleMapsEmbedUrl({ mode: 'pickup' });
  assert.equal(emptyEmbed, null);
});

test('getDeliveryStageInfo maps SP3-DRV-04 Mốc 1 and Mốc 2 correctly', () => {
  const accepted = getDeliveryStageInfo('DRIVER_ACCEPTED');
  assert.equal(accepted.stage, 'PICKUP');
  assert.equal(accepted.ctaLabel, 'TÔI ĐÃ ĐẾN QUÁN LẤY MÓN');
  assert.equal(accepted.canReturnOrder, true);

  const pickingUp = getDeliveryStageInfo('picking_up');
  assert.equal(pickingUp.stage, 'PICKUP');
  assert.equal(pickingUp.ctaLabel, 'TÔI ĐÃ ĐẾN QUÁN LẤY MÓN');
  assert.equal(pickingUp.canReturnOrder, false);

  const delivering = getDeliveryStageInfo('DELIVERING');
  assert.equal(delivering.stage, 'DELIVERING');
  assert.equal(delivering.ctaLabel, 'GIAO THÀNH CÔNG & THU TIỀN COD');
  assert.equal(delivering.canReturnOrder, false);
});

test('chat helper stores and restores per-order messages cleanly', () => {
  assert.equal(QUICK_CHAT_REPLIES.length, 3);

  const store = new Map();
  const mockStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
  };

  assert.deepEqual(loadOrderChatMessages(99, mockStorage), []);

  const msg = createDriverChatMessage(99, QUICK_CHAT_REPLIES[0], '2026-11-11T15:00:00.000Z');
  saveOrderChatMessages(99, [msg], mockStorage);

  const loaded = loadOrderChatMessages(99, mockStorage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].text, 'Tôi đang trên đường giao tới bạn');
  assert.deepEqual(loadOrderChatMessages(100, mockStorage), []);
});

