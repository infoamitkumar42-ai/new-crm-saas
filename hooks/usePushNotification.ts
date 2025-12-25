// ... inside subscribe function
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (!user) {
    console.error("User not found!");
    throw new Error("Please login first");
}

// Ye log check karo console mein
console.log('Saving subscription for User ID:', user.id); 

const { error: dbError } = await supabase
    .from('push_subscriptions')
    .upsert({
        user_id: user.id, // Ye important hai
        endpoint: endpoint,
        p256dh: p256dh,
        auth: auth,
        user_agent: navigator.userAgent
    });
