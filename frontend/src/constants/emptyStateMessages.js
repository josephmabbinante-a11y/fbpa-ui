export const EMPTY_STATE_MESSAGES = {
  sales: [
    "Your pipeline is empty. Your opportunity isn't.",
    "Every closed deal was once an empty pipeline.",
    "The next 'yes' starts with the next call.",
    "No deals yet — but the phone still works.",
    "An empty pipeline is just an untapped opportunity.",
  ],
  productivity: [
    "Nothing here yet. Perfect time to start something.",
    "Progress begins where procrastination ends.",
    "The best time to start was yesterday. The second best time is now.",
    "Every big win starts with a small first step.",
  ],
  humor: [
    "Even Amazon started with zero orders.",
    "No data yet. Did you try turning ambition on?",
    "This dashboard is so empty it echoes.",
    "Congratulations! You have a perfectly clean slate.",
  ],
  logistics: [
    "No loads yet. Time to move some freight.",
    "Every shipment starts with the first load.",
    "The road ahead is open — let's fill it.",
    "No freight to track. Yet.",
  ],
  carriers: [
    "No carriers added yet. Build your network.",
    "Your carrier roster awaits its first recruit.",
    "Great capacity starts with great carriers.",
  ],
  analytics: [
    "No activity yet. Once you do things, we'll track them.",
    "Data lives here — as soon as there's some to show.",
    "Import some data and watch the insights roll in.",
    "Charts love data. Give them something to work with.",
  ],
  general: [
    "Nothing here yet. Let's change that.",
    "Empty for now, but full of potential.",
    "A clean slate is the best place to start.",
  ],
};

/**
 * Returns a random message from the given category (or general if none/unknown).
 * @param {'sales'|'productivity'|'humor'|'logistics'|'carriers'|'analytics'|'general'} [category]
 * @returns {string}
 */
export function getRandomEmptyStateMessage(category) {
  const messages =
    category && EMPTY_STATE_MESSAGES[category]
      ? EMPTY_STATE_MESSAGES[category]
      : EMPTY_STATE_MESSAGES.general;
  return messages[Math.floor(Math.random() * messages.length)];
}
