Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer

$questions = @(
    @("q1", "Hi! Welcome to Cuemath's tutor screening. I'm your AI interviewer today. To start, could you tell me a little about yourself and why you're interested in tutoring with Cuemath?"),
    @("q1-followup", "What age groups have you worked with before, if any?"),
    @("q2", "Here's a scenario: a 9-year-old student looks confused and says they don't understand fractions at all. How would you explain what a fraction is to them?"),
    @("q2-followup", "Can you give me a real-world example you'd use?"),
    @("q3", "Imagine a student has been staring at a problem for 5 minutes and is getting frustrated. They say, I'm just bad at math. What do you do?"),
    @("q3-followup", "How do you keep them motivated without just giving them the answer?"),
    @("q4", "How would you explain the concept of multiplication to a child who only understands addition so far?"),
    @("q5", "Last question - what do you think makes a truly great math tutor? Not just a good one, but someone a student will remember years later."),
    @("closing", "Thank you so much! That's all our questions. We'll be in touch soon.")
)

$outputDir = "public/audio"
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir }

foreach ($q in $questions) {
    $id = $q[0]
    $text = $q[1]
    $path = Join-Path $outputDir "$id.wav"
    Write-Host "Generating $path..."
    $speak.SetOutputToWaveFile($path)
    $speak.Speak($text)
}

$speak.Dispose()
Write-Host "Audio generation complete!"
