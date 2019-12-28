const randomString = require('crypto-random-string');
const { AuthorizationAccessToken } = require('../../seqModels');

module.exports = {
  getNewAccessToken: async (clientId, authorizationClientId, refreshable) => {
    const existingActiveAccessTokens = await AuthorizationAccessToken.findAll({ where: {
      owner: clientId,
      authorizationClientId,
      status: 'active',
    } });

    const token = randomString({ length: 256, type: 'url-safe' });
    const refreshToken = refreshable ? randomString({ length: 256, type: 'url-safe' }) : undefined;
    const accessToken = await AuthorizationAccessToken.create({
      token,
      refreshToken,
      expire: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      owner: clientId,
      authorizationClientId,
      status: 'active',
    });

    const promises = existingActiveAccessTokens.map(token => (async () => {
      token.status = 'revoked';
      await token.save();
    })());

    await Promise.all(promises);
    return accessToken;
  },
};