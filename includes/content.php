<?php
require_once __DIR__ . '/config.php';

// Default site content. Editing the site through the admin console writes a copy
// to data/content.json; this array is the seed / fallback and documents every
// editable field.
function default_content(): array
{
    return [
        'site' => [
            'orgName' => 'Vietnamese Student Association',
            'university' => 'Auburn University',
            'email' => 'vsaauburn@gmail.com',
            'phone' => '(334) 559-0853',
            'phoneCustomFormat' => 'no',
            'newsletterTagline' => 'Follow us on social media to stay updated on events, meetings, and everything VSA.',
            'newsletterHeading' => 'Sign Up for VSA Newsletters',
            'newsletterButton' => 'Subscribe',
            'newsletterEmailLabel' => 'Email',
            'contactEmailLabel' => 'Email:',
            'contactPhoneLabel' => 'Phone:',
            'unsubscribeLinkLabel' => 'Unsubscribe',
            'skipLinkLabel' => 'Skip to main content',
            'navHome' => 'Home',
            'navAbout' => 'About',
            'navExecutiveBoard' => 'Executive Board',
            'navRoyaleDirectors' => 'AU Royale Directors',
            'navTechTeam' => 'Tech Team',
            'navEvents' => 'Events',
            'navRoyale' => 'AU Royale',
            'navGallery' => 'Gallery',
            'navMerch' => 'Merch',
            'navFaqs' => 'FAQs',
            'footerCopyright' => 'Auburn Vietnamese Student Association. All rights reserved.',
            // Unsubscribe page copy (Admin → Site).
            'unsubscribeKicker' => 'Newsletter',
            'unsubscribeHeading' => 'Unsubscribe',
            'unsubscribeLead' => 'Enter the email you used to subscribe and we’ll process your request.',
            'unsubscribeConfirmButton' => 'Confirm unsubscribe',
            'unsubscribeRequestButton' => 'Request unsubscribe',
            'unsubscribeNote' => 'Changed your mind? Subscribe again anytime from the footer on auburnvsa.com.',
            'slideshowSeconds' => '2',
            'alumniIdleSeconds' => '5',
            'alumniStepMs' => '180',
            // Button hover/press styles (search BUTTON_EFFECTS).
            'buttonEffect' => 'lift',
            // Seasonal overlay (search HOLIDAY_THEMES). auto = calendar windows; off = force none.
            'holidayTheme' => 'auto',
            'constructionMode' => 'no',
            'constructionTitle' => "We'll be back soon",
            'constructionBody' => 'Auburn VSA’s website is temporarily unavailable while we make updates. Please check back soon — or leave us a message below.',
            'publicBaseUrl' => '',
        ],
        'branding' => [
            'logo' => '',
        ],
        'effects' => [
            'teamAccentLine' => 'yes',
            'teamFloatingMotifs' => 'no',
        ],
        'socials' => [
            ['label' => 'Instagram', 'href' => 'https://www.instagram.com/auburnvsa', 'icon' => 'instagram', 'image' => ''],
            ['label' => 'AUinvolve', 'href' => 'https://auburn.campuslabs.com/engage/organization/vsa', 'icon' => 'auinvolve', 'image' => ''],
            ['label' => 'X', 'href' => '', 'icon' => 'x', 'image' => ''],
            ['label' => 'Facebook', 'href' => '', 'icon' => 'facebook', 'image' => ''],
            ['label' => 'YouTube', 'href' => '', 'icon' => 'youtube', 'image' => ''],
            ['label' => 'LinkedIn', 'href' => '', 'icon' => 'linkedin', 'image' => ''],
            ['label' => 'Discord', 'href' => '', 'icon' => 'discord', 'image' => ''],
            ['label' => 'TikTok', 'href' => '', 'icon' => 'tiktok', 'image' => ''],
        ],
        'links' => [
            'learnMore' => '/executive-board',
            'join' => 'https://auburn.campuslabs.com/engage/organization/vsa',
            'purchaseTickets' => 'https://calendar.auburn.edu/event/auburn-royale',
        ],
        'home' => [
            'heroWelcome' => 'Welcome to Auburn VSA',
            'heroTitle' => 'Auburn VSA',
            'heroBrief' => 'Open to every Auburn student — Vietnamese or not. Join free on AUinvolve, follow @auburnvsa, and come to a meeting. No application, just show up.',
            'heroImage' => '',
            // One-line path under hero CTAs (empty = hide).
            'joinPathHint' => 'Join free on AUinvolve → follow @auburnvsa → come to a meeting. Everyone’s welcome.',
            'aboutText' => 'Auburn VSA is the official Vietnamese Student Association at Auburn University. We are a welcoming community that celebrates Vietnamese culture through friendship, service, and connection. Through cultural events, philanthropy, and social gatherings, Auburn VSA creates a space where students of all backgrounds can learn, grow, and feel at home while sharing and preserving Vietnamese traditions. As part of the Union of Vietnamese Student Associations of the Southeast (UVSASE), Auburn VSA also connects with VSAs across the Southeast to strengthen community and cultural pride.',
            // Section labels / buttons (use | for orange words in headings).
            'aboutHeading' => 'About | Auburn VSA',
            'heroJoinLabel' => 'Join VSA on AUinvolve',
            'heroIgLabel' => 'Follow on Instagram',
            'aboutJoinLabel' => 'Join on AUinvolve',
            'aboutBoardLabel' => 'Meet the Executive Board',
            'whyJoinHeading' => 'Why | Join VSA|?',
            'whyJoinCtaLabel' => 'Join on AUinvolve',
            'howToJoinCtaLabel' => 'Join Now on AUinvolve',
            'howToJoinFaqsLabel' => 'More FAQs',
            'instagramHeading' => 'Latest from | @auburnvsa',
            'instagramSubtext' => 'Photos and posts curated from Instagram — tap to open on Instagram.',
            'instagramButtonLabel' => 'Open Instagram',
            'alumniHeading' => 'Where we are | now',
            'alumniSubtext' => 'Auburn VSA alumni — where Tiger trails lead.',
            'ctaHeading' => 'Find your |community|. Celebrate your |culture|. Make lasting |memories|.',
            'ctaJoinLabel' => 'Join Now on AUinvolve',
            'ctaIgLabel' => 'Follow @auburnvsa',
            'stickyJoinLabel' => 'Join VSA',
            'nextUpLabel' => 'Next up',
            'nextUpDetailsLabel' => 'Event details',
            'nextUpGcalLabel' => 'Add to Google Calendar',
            'nextUpIcsLabel' => 'Download .ics',
            'nextUpViewEventsLabel' => 'View all events',
            'nextUpJoinLabel' => 'New here? Join VSA',
            'recentEmptyText' => 'Upcoming events will show up here soon. Follow us on Instagram for the latest.',
            'orgEmptyLabel' => 'Organization photos coming soon',
            'galleryImages' => [],
            'whyJoin' => [
                ['title' => 'Culture', 'body' => 'Experience and share Vietnamese traditions, food, language, and cultural events with Auburn VSA and the wider Auburn University community.', 'image' => ''],
                ['title' => 'Growth', 'body' => 'Develop leadership skills through Auburn VSA service, committees, ACE mentorship, and Auburn Royale — meaningful memories for your college years.', 'image' => ''],
                ['title' => 'Community', 'body' => 'Find a welcoming Auburn VSA space to meet new people, make friends, and build lifelong connections at Auburn University.', 'image' => ''],
            ],
            // Legacy flat image row — prefer whyJoin[].image. Kept so old content.json still loads;
            // get_content() / admin migrate these into the matching Culture / Growth / Community column.
            'whyJoinImages' => [],
            'howToJoinHeading' => 'How to | join',
            'howToJoinSteps' => [
                [
                    'title' => 'Join on AUinvolve',
                    'body' => 'Tap Join Now — registering with the org is free, and takes about a minute.',
                ],
                [
                    'title' => 'Follow @auburnvsa',
                    'body' => 'Meeting times, GroupMe invites, and event updates land on Instagram first.',
                ],
                [
                    'title' => 'Come to a meeting',
                    'body' => 'General body meetings are open to all students. Sit with friends, introduce yourself, and have fun!',
                ],
            ],
            'ctaText' => 'Ready to join? Register on AUinvolve, follow @auburnvsa, and come to the next meeting. We’re glad you’re here.',
            // Mobile sticky Join chip on Home (session-dismissible).
            'stickyJoin' => 'yes',
            'instagramPosts' => [],
            'alumni' => [],
        ],
        'team' => [
            'executiveBoard' => [],
            'techTeam' => [],
            'royaleDirectors' => [],
            'intros' => [
                'executiveBoard' => 'The officer team is dedicated to creating an engaging and welcoming community where members can connect, grow, and get involved. By organizing events, supporting initiatives, and encouraging participation, they help shape the organization\'s culture and provide opportunities for members to make lasting friendships and meaningful contributions.',
                'techTeam' => 'The Tech Team designs, develops, and maintains the organization\'s website and digital platforms. They work behind the scenes to create a seamless online experience, keep information up to date, and build tools that help members stay connected, informed, and engaged with the community.',
                'royaleDirectors' => 'The AU Royale Directors plan and lead Auburn Royale — VSA\'s signature cultural carnival. They coordinate games, performances, food, ticketing, sponsors, and the night-of experience so guests can celebrate Vietnamese culture together.',
            ],
            // Page title / section heading per roster (use | for orange words).
            'pageTitles' => [
                'executiveBoard' => 'VSA| Executive Board',
                'techTeam' => 'VSA| Tech Team',
                'royaleDirectors' => 'AU Royale| Directors',
            ],
            'sectionHeadings' => [
                'executiveBoard' => 'Meet the |Executive Board',
                'techTeam' => 'Meet the |Tech Team',
                'royaleDirectors' => 'Meet the |AU Royale Directors',
            ],
            'cycleLabel' => 'Also meet',
        ],
        'events' => [
            // Public Google Calendar URL (Events page button). Empty = hide button.
            'calendarUrl' => '',
            'pageHeading' => 'Events',
            'viewAllLabel' => 'View all events',
            'upcomingHeading' => 'Upcoming Events',
            'allModalTitle' => 'All events',
            'calendarKicker' => 'Schedule',
            'calendarTitle' => 'Auburn VSA calendar',
            'calendarButtonLabel' => 'Open full calendar',
            'upcoming' => [
                [
                    'name' => 'Involvement Fair',
                    'date' => 'Thursday, August 20, 2026 · 3:30–6:30 PM',
                    'dateMode' => 'scheduled',
                    'dateStart' => '2026-08-20',
                    'timeStart' => '15:30',
                    'timeEnd' => '18:30',
                    'location' => 'Campus Green, Auburn University',
                    'description' => 'Meet Auburn VSA at the Fall Involvement Fair. Learn about meetings, Auburn Royale, ACE, and how to join on AUinvolve.',
                    'image' => '',
                    'link' => 'https://auburn.campuslabs.com/engage/organization/vsa',
                    'showOnHome' => 'yes',
                ],
                [
                    'name' => 'Auburn Royale',
                    'date' => 'Coming up',
                    'dateMode' => 'upcoming',
                    'dateStart' => '',
                    'timeStart' => '',
                    'timeEnd' => '',
                    'location' => 'Student Activities Center',
                    'description' => 'Carnival-style Vietnamese games, food, prizes, and performances. $15 admission.',
                    'image' => '',
                    'link' => 'au-royale.html',
                    'showOnHome' => 'yes',
                ],
                [
                    'name' => 'Open meeting — all students welcome',
                    'date' => 'Coming up · every other Tue/Thu',
                    'dateMode' => 'custom',
                    'dateStart' => '',
                    'timeStart' => '',
                    'timeEnd' => '',
                    'location' => 'Posted on Instagram & AUinvolve',
                    'description' => 'Open to all students — no application. Exact times and rooms are announced on @auburnvsa.',
                    'image' => '',
                    'link' => 'https://www.instagram.com/auburnvsa',
                    'showOnHome' => 'yes',
                ],
            ],
        ],
        'royale' => [
            'heroTitle' => 'Auburn Royale',
            'heroSubtitle' => 'Auburn VSA’s annual cultural carnival — games, food, prizes & performances',
            // Details aligned with Auburn University Events Calendar listing for Auburn Royale.
            'eventDate' => 'Saturday, April 11, 2026 · 4:30–9:00 PM',
            'eventDateMode' => 'scheduled',
            'eventDateStart' => '2026-04-11',
            'eventDateTimeStart' => '16:30',
            'eventDateTimeEnd' => '21:00',
            'eventLocation' => 'Student Activities Center · 684 Biggio Drive, Auburn, AL 36849',
            'eventCost' => '$15 admission',
            'introText' => 'Auburn Royale is the Vietnamese Student Association at Auburn University’s signature annual celebration. Traditional Vietnamese games are set up carnival-style for attendees to play, and winners choose from a selection of prizes. It is a night to gather with friends, families, alumni, and the wider Auburn community to cheer, share food, and celebrate Vietnamese culture on campus.',
            'aboutHeading' => 'About | Auburn Royale',
            'expectHeading' => 'What to expect',
            'expectText' => 'Expect carnival-style traditional Vietnamese games, cool prizes for winners, food, and performances from VSA. The evening runs like a campus fair — move between game stations, grab a bite, and catch student performances throughout the night at the Student Activities Center.',
            'welcomeHeading' => 'Who’s welcome',
            'welcomeText' => 'Auburn Royale welcomes current students, alumni, donors, friends, and families. Whether you are already part of VSA or visiting for the first time, you are invited to play, watch, and celebrate with us. Everyone is welcome to experience Vietnamese culture at Auburn.',
            // Shared player with Gallery (YouTube/Vimeo link or uploaded file).
            // Shows above the hero; section hides itself when videoUrl is empty.
            'videoUrl' => '',
            'videoImage' => '',
            'videoHeading' => 'Royale | in motion',
            'videoSubtext' => 'See what a night at Auburn Royale looks like.',
            'galleryHeading' => 'Gallery | highlights',
            'gallerySubtext' => 'Moments from Auburn Royale.',
            'galleryButtonLabel' => 'View full gallery',
            'sponsorsHeading' => 'Sponsors | & partners',
            'sponsorsSubtext' => 'Thank you to the partners who help make Auburn Royale possible.',
            'ticketingHeading' => 'Ticketing',
            'ticketingText' => 'Tickets are required for entry. Admission is $15 and includes access to the event plus tickets for games, food, and VSA performances. Purchase in advance through the Auburn events calendar, then join us Saturday, April 11, 2026 from 4:30–9:00 PM CDT at the Student Activities Center (684 Biggio Drive, Auburn, AL).',
            'ticketsButtonLabel' => 'Purchase Tickets',
            'shareButtonLabel' => 'Share Auburn Royale',
            'copyButtonLabel' => 'Copy link',
            'sponsorsImages' => [],
        ],
        'gallery' => [
            'pageHeading' => 'Gallery',
            'activeYearId' => '2025-2026',
            'years' => [
                [
                    'id' => '2025-2026',
                    'label' => '2025 - 2026',
                    'videoUrl' => 'https://www.youtube.com/watch?v=jogAgkyC9hs',
                    'videoImage' => '',
                    'categories' => [
                        ['name' => 'General Body Meetings', 'image' => '', 'images' => []],
                        ['name' => 'Events & Socials', 'image' => '', 'images' => []],
                        ['name' => 'Auburn Royale', 'image' => '', 'images' => []],
                    ],
                ],
                [
                    'id' => '2024-2025',
                    'label' => '2024 - 2025',
                    'videoUrl' => 'https://www.youtube.com/watch?v=XAtx7G2QAMo',
                    'videoImage' => '',
                    'categories' => [
                        ['name' => 'Year Recap', 'image' => '', 'images' => []],
                        ['name' => 'Events', 'image' => '', 'images' => []],
                        ['name' => 'Auburn Royale', 'image' => '', 'images' => []],
                    ],
                ],
                [
                    'id' => '2023-2024',
                    'label' => '2023 - 2024',
                    'videoUrl' => 'https://www.youtube.com/watch?v=BzbjtTubvD8',
                    'videoImage' => '',
                    'categories' => [
                        ['name' => 'Year Recap', 'image' => '', 'images' => []],
                        ['name' => 'Graduates', 'image' => '', 'images' => []],
                        ['name' => 'Auburn Royale', 'image' => '', 'images' => []],
                    ],
                ],
            ],
        ],
        'merch' => [
            'pageHeading' => 'Merchandise',
            'pageLede' => 'Rep Auburn VSA — tap any item for details and to buy when a shop link is live.',
            'shopHeading' => 'Shop the collection',
            'showcaseImage' => '',
            'showcaseImages' => [],
            'products' => [
                [
                    'name' => 'VSA Shirt',
                    'price' => '$25.00',
                    'image' => '',
                    'link' => 'https://www.instagram.com/auburnvsa',
                    'status' => 'Coming soon',
                    'description' => 'Classic Auburn VSA tee. Soft cotton, orange accents — perfect for meetings, Royale, and game days. Watch Instagram for drop dates.',
                ],
                [
                    'name' => 'VSA Sweatshirt',
                    'price' => '$40.00',
                    'image' => '',
                    'link' => 'https://www.instagram.com/auburnvsa',
                    'status' => 'Coming soon',
                    'description' => 'Cozy crewneck for cooler nights on campus. Represent VSA between classes and at events.',
                ],
                [
                    'name' => 'VSA Sticker',
                    'price' => '$3.00',
                    'image' => '',
                    'link' => 'https://www.instagram.com/auburnvsa',
                    'status' => 'Coming soon',
                    'description' => 'Laptop-ready vinyl sticker with Auburn VSA branding. Small drop, big pride.',
                ],
            ],
        ],
        // Footer-logo music easter egg (Admin → Music). Audio files live in uploads/.
        'music' => [
            'enabled' => 'no',
            'clickCount' => '7',
            'tracks' => [
                // ['title' => '', 'artist' => '', 'src' => 'uploads/...mp3']
            ],
        ],
        // FAQ page chrome (Q&A list stays in faqs[]).
        'faqPage' => [
            'pageHeading' => 'Frequently Asked Questions',
            'ctaKicker' => 'Still curious?',
            'ctaCopy' => 'Ask anything about Auburn VSA. We’ll review it and add an answer when we can.',
            'askButtonLabel' => 'Ask a question',
            'sheetTitle' => 'Ask a question',
            'sheetLead' => 'Your question goes to our team first. Published answers appear in the list above.',
            'submitLabel' => 'Submit question',
        ],
        'faqs' => [
            ['question' => 'What is VSA?', 'answer' => 'VSA (Vietnamese Student Association) is a cultural and social organization that promotes Vietnamese heritage while building a supportive community for students of all backgrounds. Auburn VSA also collaborates with UVSASE (Union of Vietnamese Student Associations of the Southeast) on regional traditions and events.'],
            ['question' => 'Who is welcome to join?', 'answer' => 'Everyone. You do not need to be Vietnamese to join — if you are interested in Vietnamese culture, making friends, volunteering, or attending events, you are welcome.'],
            ['question' => 'How do I join Auburn VSA?', 'answer' => 'Start at the official Auburn VSA website (auburnvsa.com), join through AUinvolve, follow @auburnvsa on Instagram, and come to a general body meeting or welcome event (like the Involvement Fair). There is no complicated application — showing up and getting connected is the best first step.'],
            ['question' => 'When are general body meetings?', 'answer' => 'General body meetings are typically held every other week on Tuesdays or Thursdays and are open to all students. Exact dates, times, and locations are posted on Instagram, GroupMe, and AUinvolve.'],
            ['question' => 'What should I expect at my first meeting?', 'answer' => 'A friendly, low-pressure space to meet members, learn about upcoming events, and hear club updates. You can sit with friends, introduce yourself to e-board members, and leave whenever you need to — no pressure to know anyone beforehand.'],
            ['question' => 'What does VSA do?', 'answer' => 'We host cultural events, social gatherings, volunteer and philanthropic activities, collaborations with other student organizations, and signature programs like Auburn Royale and Anh Chi Em mentorship.'],
            ['question' => 'What is Auburn Royale?', 'answer' => 'Auburn Royale is VSA’s annual carnival-style cultural event featuring traditional Vietnamese games, prizes, food, and performances. Tickets are required for entry; details and ticket links are shared on our Events and AU Royale pages.'],
            ['question' => 'What is Anh Chi Em (ACE)?', 'answer' => 'Anh Chi Em is VSA’s mentorship program that pairs members with a “big/little” for guidance, friendship, and support throughout the school year. Watch for ACE announcements at meetings and on our socials.'],
            ['question' => 'How can I get more involved?', 'answer' => 'Attend meetings regularly, volunteer at events, join committees, participate in ACE, help with Auburn Royale, or run for an executive board position when applications open.'],
            ['question' => 'Is there a membership fee?', 'answer' => 'Come to as many meetings as you like first — visiting is free and nothing is due to check us out. If you decide to become a full member, dues are $10 per semester and help cover events, materials, and club activities. Ask an e-board member at a meeting whenever you’re ready.'],
            ['question' => 'What leadership opportunities are available?', 'answer' => 'Members can run for roles such as President, Internal Vice President, External Vice President, Treasurer, Media Director, Secretary, Events Director, ACE Director, Marketing Director, and Auburn Royale Executive Director, plus other committee or director positions as needed.'],
            ['question' => 'Are there regional or out-of-town events?', 'answer' => 'Yes. Through UVSASE, members can attend regional experiences such as SELC (Southeast Leadership Camp) and Olympics, which build leadership skills and connections with other VSAs across the Southeast.'],
            ['question' => 'How do I stay updated on events?', 'answer' => 'Follow @auburnvsa on Instagram, join our GroupMe when invited, check AUinvolve, and subscribe to the newsletter on this website. Meeting and event details are posted there first.'],
            ['question' => 'Do I have to pay for every event?', 'answer' => 'Many socials and meetings are free for members, but some signature events (like Auburn Royale) require a ticket. Pricing is always listed with the event announcement.'],
            ['question' => 'Can alumni or non-students attend events?', 'answer' => 'Some events welcome alumni, friends, and the broader community — especially larger cultural events like Auburn Royale. Check the specific event listing or ask us if you are unsure.'],
            ['question' => 'Where can I find merch?', 'answer' => 'Visit the Merch page on this site. When a shop link is available for a product, it will take you to the current storefront or order form.'],
            ['question' => 'How can I contact VSA?', 'answer' => 'Email vsaauburn@gmail.com, call or text (334) 559-0853, message us on Instagram @auburnvsa, or use the contact option on our AUinvolve page. You can also reach out to any e-board member at a meeting.'],
            ['question' => 'I have another question — what should I do?', 'answer' => 'Use the question form on this FAQs page, email us, or DM Instagram. We are happy to help with membership, events, volunteering, ACE, Auburn Royale, or anything else about VSA.'],
        ],
    ];
}

// Recursively merge saved content over the defaults so new fields keep working
// even if the saved file predates them. Numeric-keyed arrays (lists) are
// replaced wholesale by the saved value.
function merge_content(array $defaults, array $saved): array
{
    $result = $defaults;
    foreach ($saved as $key => $value) {
        if (
            is_array($value) &&
            isset($result[$key]) &&
            is_array($result[$key]) &&
            array_keys($result[$key]) !== range(0, count($result[$key]) - 1)
        ) {
            $result[$key] = merge_content($result[$key], $value);
        } else {
            $result[$key] = $value;
        }
    }
    return $result;
}

/**
 * Fold legacy home.whyJoinImages[] into whyJoin[i].image (in memory).
 * Keeps Culture / Growth / Community photos attached to their columns.
 */
function normalize_why_join_images(array $content): array
{
    if (!isset($content['home']) || !is_array($content['home'])) {
        return $content;
    }
    $home = &$content['home'];
    $cols = isset($home['whyJoin']) && is_array($home['whyJoin']) ? $home['whyJoin'] : [];
    $legacy = isset($home['whyJoinImages']) && is_array($home['whyJoinImages'])
        ? $home['whyJoinImages']
        : [];
    if ($legacy === []) {
        $home['whyJoin'] = $cols;
        return $content;
    }
    $n = max(count($cols), count($legacy));
    for ($i = 0; $i < $n; $i++) {
        if (!isset($cols[$i]) || !is_array($cols[$i])) {
            $cols[$i] = ['title' => '', 'body' => '', 'image' => ''];
        }
        $img = trim((string) ($cols[$i]['image'] ?? ''));
        if ($img === '' && !empty($legacy[$i]) && is_string($legacy[$i])) {
            $cols[$i]['image'] = $legacy[$i];
        }
        if (!array_key_exists('image', $cols[$i])) {
            $cols[$i]['image'] = '';
        }
    }
    $home['whyJoin'] = $cols;
    return $content;
}

function get_content(): array
{
    // Apply any due scheduled publishes before reading live content.
    require_once __DIR__ . '/publish.php';
    publish_apply_due();

    $defaults = default_content();
    if (!file_exists(CONTENT_FILE)) {
        return $defaults;
    }
    $raw = file_get_contents(CONTENT_FILE);
    $saved = json_decode($raw, true);
    if (!is_array($saved)) {
        return $defaults;
    }
    return normalize_why_join_images(merge_content($defaults, $saved));
}

function save_content(array $content): bool
{
    if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
        return false;
    }
    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $tmp = CONTENT_FILE . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    // Atomic replace. On Windows, rename() cannot overwrite an existing file.
    if (@rename($tmp, CONTENT_FILE)) {
        return true;
    }
    if (is_file(CONTENT_FILE) && !@unlink(CONTENT_FILE)) {
        @unlink($tmp);
        return false;
    }
    if (@rename($tmp, CONTENT_FILE)) {
        return true;
    }
    // Last resort: copy then remove temp (still better than leaving a partial write).
    $copied = @copy($tmp, CONTENT_FILE);
    @unlink($tmp);
    return $copied;
}

// Top-level content sections the admin console may edit.
const CONTENT_SECTIONS = [
    'site', 'branding', 'effects', 'socials', 'links', 'home',
    'team', 'events', 'royale', 'gallery', 'merch', 'faqPage', 'faqs', 'music',
];
