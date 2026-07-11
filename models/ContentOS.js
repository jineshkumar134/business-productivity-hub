const mongoose = require('mongoose');

const ContentOSSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Employees / Internal', 'Clients / Parents', 'Department Leaders', 'Stakeholders', 'Custom / Public', 'Parents', 'Students', 'Teachers', 'Principals', 'Custom'],
        default: 'Employees / Internal'
    },
    objective: {
        type: String,
        enum: ['Internal Training', 'Brand Awareness', 'Client Engagement', 'Marketing / Sales Conversion', 'Strategic Update', 'Awareness', 'Education', 'Engagement', 'Lead Generation', 'Sales', 'Brand Building'],
        default: 'Internal Training'
    },
    referenceLink: String,
    
    // Framework
    hook: String,
    curiosity: String,
    story: String,
    proof: String,
    lesson: String,
    cta: String,

    // Production Status
    currentStatus: {
        type: String,
        enum: [
            'Idea', 'Research', 'Script Ready', 'Shoot Scheduled', 
            'Shooting Done', 'Editing', 'Review Round 1', 'Review Round 2', 
            'Approved', 'Scheduled', 'Published', 'Performance Review'
        ],
        default: 'Idea'
    },
    
    // Dates
    ideaDate: Date,
    researchDate: Date,
    scriptDate: Date,
    shootDate: Date,
    editingDate: Date,
    reviewDate: Date,
    approvalDate: Date,
    publishingDate: Date,

    // Review Details
    reviewer: String,
    reviewStatus: {
        type: String,
        enum: ['Pending', 'Changes Required', 'Approved'],
        default: 'Pending'
    },
    reviewNotes: String,

    // Production Links
    rawVideoLink: String,
    voiceOverLink: String,
    bRollFolder: String,
    musicLink: String,
    thumbnailLink: String,
    canvaLink: String,
    driveFolder: String,
    publishedLink: String,

    // Instagram Analytics
    instagramReach: String,
    instagramViews: String,
    instagramLikes: String,
    instagramComments: String,
    instagramShares: String,
    instagramSaves: String,
    instagramProfileVisits: String,
    instagramFollowersGained: String,
    instagramWatchTime: String,
    instagramAvgWatchTime: String,
    instagramRetention: String,
    instagramCompletion: String,

    // YouTube Analytics
    ytViews: String,
    ytImpressions: String,
    ytCTR: String,
    ytWatchHours: String,
    ytAvgViewDuration: String,
    ytSubscribersGained: String,
    ytReturningViewers: String,
    ytNewViewers: String,
    ytRevenue: String,
    ytRPM: String,
    ytCPM: String,

    // Learnings & Next Actions
    whatWorked: String,
    whatFailed: String,
    bestHook: String,
    improvements: String,
    repurposeToShorts: { type: Boolean, default: false },
    createCarousel: { type: Boolean, default: false },
    runAds: { type: Boolean, default: false },
    makePart2: { type: Boolean, default: false },

    createdBy: String
}, {
    timestamps: true
});

module.exports = mongoose.model('ContentOS', ContentOSSchema);
