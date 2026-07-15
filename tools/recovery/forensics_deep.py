import os
import glob
import json

brain_dir = r'C:\Users\uikey\.gemini\antigravity-ide\brain'

target_keywords = [
    'pika-review',
    'luma-dream-machine'
]

print("Deep searching transcripts content fields and run_command args...")
transcripts = glob.glob(os.path.join(brain_dir, '*', '.system_generated', 'logs', 'transcript_full.jsonl'))

found_in_content = []

for t_path in transcripts:
    session_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(t_path))))
    try:
        with open(t_path, 'r', encoding='utf-8') as f:
            for line_idx, line in enumerate(f):
                lower_line = line.lower()
                if not any(k in lower_line for k in target_keywords):
                    continue
                
                try:
                    data = json.loads(line)
                    # check content field
                    content = data.get('content', '')
                    if content and any(k in content.lower() for k in target_keywords):
                        found_in_content.append(f"Session {session_id} Line {line_idx}: Content match length {len(content)}")
                        
                        # Save the massive content match to a file for inspection
                        if len(content) > 1000:
                            with open(f"C:\\Users\\uikey\\OneDrive\\Desktop\\Master Folder\\Lochitra\\recovery\\deep_content_{session_id}_{line_idx}.txt", "w", encoding="utf-8") as out:
                                out.write(content)
                    
                    # check run_command
                    for tc in data.get('tool_calls', []):
                        if tc.get('name') in ['run_command', 'default_api:run_command']:
                            args_raw = tc.get('args', {})
                            if isinstance(args_raw, str):
                                try:
                                    args = json.loads(args_raw)
                                except:
                                    continue
                            else:
                                args = args_raw
                                
                            cmd = args.get('CommandLine', '')
                            if cmd and any(k in cmd.lower() for k in target_keywords):
                                found_in_content.append(f"Session {session_id} Line {line_idx}: run_command match length {len(cmd)}")
                                if len(cmd) > 1000:
                                    with open(f"C:\\Users\\uikey\\OneDrive\\Desktop\\Master Folder\\Lochitra\\recovery\\deep_cmd_{session_id}_{line_idx}.txt", "w", encoding="utf-8") as out:
                                        out.write(cmd)
                except Exception as e:
                    pass
    except Exception as e:
        pass

for f in found_in_content:
    print(f)

print("Deep search complete.")
