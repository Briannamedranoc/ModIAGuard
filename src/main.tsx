/** @jsx Devvit.createElement */
/** @jsxFrag Devvit.Fragment */
import { isT3 } from '@devvit/shared-types/tid.js';
import { Devvit, fetchDevvitWeb } from '@devvit/public-api';

const DASHBOARD_POST_TITLE = 'AI Auto-Analyzer Dashboard';

type OpenDashboardResponse = {
  postId?: string;
  navigateTo?: { url: string };
  showToast?: string;
};

/**
 * Reddit clients open a post by navigation. `showPost` is not on UIClient in this SDK;
 * navigating to the post URL is the supported equivalent.
 */
async function showPost(context: Devvit.Context, postId: `t3_${string}`): Promise<void> {
  const post = await context.reddit.getPostById(postId);
  context.ui.navigateTo(post);
}

Devvit.configure({
  redditAPI: true,
});

Devvit.addMenuItem({
  label: 'Abrir ModAiGuard Panel',
  description: 'Abre el dashboard React AI Auto-Analyzer',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    try {
      const response = await fetchDevvitWeb(context, '/internal/menu/open-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: DASHBOARD_POST_TITLE }),
      });

      const data = (await response.json()) as OpenDashboardResponse;

      if (data.showToast) {
        context.ui.showToast({ text: data.showToast, appearance: 'neutral' });
        return;
      }

      if (data.postId && isT3(data.postId)) {
        await showPost(context, data.postId);
        return;
      }

      if (data.navigateTo?.url) {
        context.ui.navigateTo(data.navigateTo.url);
        return;
      }

      context.ui.showToast({
        text: 'No se pudo abrir el dashboard.',
        appearance: 'neutral',
      });
    } catch (err) {
      context.ui.showToast({
        text: err instanceof Error ? err.message : 'Error al abrir el dashboard.',
        appearance: 'neutral',
      });
    }
  },
});

export default Devvit;
