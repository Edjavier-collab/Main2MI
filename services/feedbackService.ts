import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export interface FeedbackPayload {
    rating: number;
    comment?: string;
    userId?: string;
}

/**
 * Submit user feedback (rating + optional comment) to Supabase.
 * If Supabase is not configured, logs a warning and returns silently.
 */
export const submitFeedback = async (payload: FeedbackPayload): Promise<void> => {
    const { rating, comment, userId } = payload;

    console.log('[feedbackService] Submitting feedback:', { rating, hasComment: !!comment, userId: userId ?? 'anonymous' });

    if (!isSupabaseConfigured()) {
        console.warn('[feedbackService] Supabase not configured. Feedback not saved.');
        // Resolve silently so the UI can still show success (useful for local dev)
        return;
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.from('feedback').insert({
        user_id: userId ?? null,
        rating,
        comment: comment?.trim() || null,
        created_at: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (error) {
        console.error('[feedbackService] Failed to insert feedback:', error);
        throw new Error('Failed to submit feedback. Please try again.');
    }

    console.log('[feedbackService] Feedback submitted successfully');
};

