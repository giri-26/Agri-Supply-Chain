const express = require('express');

/**
 * Produces a placeholder router for a module whose full business logic
 * (controllers/services/validation) is being built in the next iteration
 * of this project, per the phased build plan. Wired into the app now so
 * the folder architecture, auth, and role gates are already correct -
 * only the endpoint bodies remain to be filled in.
 */
function scaffoldRouter(moduleName, plannedEndpoints = []) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      module: moduleName,
      status: 'scaffolded - business logic to be implemented in next build phase',
      plannedEndpoints,
    });
  });

  return router;
}

module.exports = scaffoldRouter;
