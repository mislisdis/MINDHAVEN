// src/modules/therapeuticQuestioner.js

/**
 * Returns a small list of targeted, open-ended therapeutic questions
 * based on emotion and severity level.
 *
 * severity: 'low' | 'medium' | 'high'
 */
function getQuestions(emotion, severity = 'low', context = null) {
  emotion = (emotion || 'neutral').toLowerCase();
  const base = {
    sadness: [
      "Can you tell me what happened before you started feeling this way?",
      "What's the heaviest part of this for you right now?",
      "Has anything helped soothe this feeling in the past?"
    ],
    fear: [
      "What's the specific worry in your mind right now?",
      "When did you first notice this fear?",
      "Is there a small step you could take that might ease it a bit?"
    ],
    anger: [
      "What part of that felt most unfair to you?",
      "When anger comes up, what usually helps you cool down?",
      "Would you like to explore what you'd want to change about this?"
    ],
    anxiety: [
      "Where in your body do you feel the anxiety?",
      "What do you think might happen if this worry came true?",
      "Would it help to try a breathing exercise together?"
    ],
    joy: [
      "What about this made you happiest?",
      "Who were you with when this happened?",
      "Would you like to celebrate this in a small way?"
    ],
    neutral: [
      "What's on your mind today?",
      "Is there anything you'd like to focus on together?"
    ]
  };

  const followUps = base[emotion] || base['neutral'];

  // severity-based pruning or intensification:
  if (severity === 'high') {
    return [
      "I’m really glad you told me that — is it okay if I ask a few questions so I can understand better?",
      ...followUps.slice(0, 2)
    ];
  } else if (severity === 'medium') {
    return followUps.slice(0, 2);
  } else {
    return followUps;
  }
}

module.exports = { getQuestions };
