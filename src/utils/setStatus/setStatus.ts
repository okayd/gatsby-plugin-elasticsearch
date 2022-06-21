import { pluginPrefix } from '../../error-utils';
import { GatsbyActivityTimer } from '../../gatsby-node.types';

/**
 * hotfix the Gatsby reporter to allow setting status (not supported everywhere)
 *
 * @param {Object} activity reporter
 * @param {String} status status to report
 */
export const setStatus = (
  activity: GatsbyActivityTimer | undefined,
  status: string
): void => {
  if (activity && activity.setStatus) {
    activity.setStatus(status);
  } else {
    console.log(`[${pluginPrefix}]`, status);
  }
};
