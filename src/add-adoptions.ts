const DEPRECATION_NOTICE = `
This task is deprecated and is no longer maintained.

Adding adoptions has moved to watchtower. Please use watchtower instead.
`;

console.error(DEPRECATION_NOTICE.trim());
process.exit(1);
