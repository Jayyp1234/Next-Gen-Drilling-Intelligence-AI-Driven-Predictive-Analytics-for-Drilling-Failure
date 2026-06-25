#!/usr/bin/env python3
"""
Data Quality Assessment Script

Analyzes drilling data files to assess:
- Data structure (depth-indexed vs time-indexed)
- Parameter coverage
- Data completeness
- Format compatibility
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import json

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    import PyPDF2
    import pdfplumber
    HAS_PDF_LIBS = True
except ImportError:
    HAS_PDF_LIBS = False
    print("Warning: PDF libraries not installed. Install with: pip install PyPDF2 pdfplumber")

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    print("Warning: python-docx not installed. Install with: pip install python-docx")


class DataQualityAssessor:
    """Assesses quality and structure of drilling data files."""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.results = {
            "files_analyzed": [],
            "summary": {
                "total_files": 0,
                "wells_identified": [],
                "has_time_indexed": False,
                "has_event_labels": False,
                "parameter_coverage": {},
                "critical_gaps": []
            }
        }
    
    def assess_all_files(self) -> Dict:
        """Assess all files in the data directory."""
        files = list(self.data_dir.glob("*"))
        
        for file_path in files:
            if file_path.is_file():
                self.assess_file(file_path)
        
        self.results["summary"]["total_files"] = len(self.results["files_analyzed"])
        self._generate_summary()
        
        return self.results
    
    def assess_file(self, file_path: Path) -> Dict:
        """Assess a single file."""
        file_info = {
            "filename": file_path.name,
            "file_type": file_path.suffix.lower(),
            "file_size_mb": file_path.stat().st_size / (1024 * 1024),
            "well_id": None,
            "indexing_type": None,  # "depth", "time", "unknown"
            "parameters_found": [],
            "has_timestamps": False,
            "has_event_labels": False,
            "data_quality_score": 0,
            "issues": []
        }
        
        try:
            if file_path.suffix.lower() == ".pdf":
                file_info.update(self._assess_pdf(file_path))
            elif file_path.suffix.lower() in [".doc", ".docx"]:
                file_info.update(self._assess_doc(file_path))
            elif file_path.suffix.lower() == ".csv":
                file_info.update(self._assess_csv(file_path))
            else:
                file_info["issues"].append(f"Unsupported file type: {file_path.suffix}")
        except Exception as e:
            file_info["issues"].append(f"Error analyzing file: {str(e)}")
        
        self.results["files_analyzed"].append(file_info)
        return file_info
    
    def _assess_pdf(self, file_path: Path) -> Dict:
        """Assess PDF file structure."""
        info = {
            "parameters_found": [],
            "has_timestamps": False,
            "has_event_labels": False,
            "indexing_type": "unknown",
            "well_id": None
        }
        
        if not HAS_PDF_LIBS:
            info["issues"] = ["PDF libraries not available"]
            return info
        
        try:
            # Try pdfplumber first (better for tables)
            with pdfplumber.open(file_path) as pdf:
                text_content = ""
                for page in pdf.pages[:5]:  # Check first 5 pages
                    text_content += page.extract_text() or ""
                
                # Check for well ID
                well_patterns = ["WELL NAME:", "WELL:", "Well Name:", "Well:"]
                for pattern in well_patterns:
                    if pattern in text_content:
                        # Extract well name (simple extraction)
                        idx = text_content.find(pattern)
                        line = text_content[idx:idx+100]
                        parts = line.split("\n")[0].split(":")
                        if len(parts) > 1:
                            info["well_id"] = parts[1].strip()[:50]
                        break
                
                # Check for timestamps
                timestamp_patterns = [
                    "timestamp", "time", "date", "hour", "minute",
                    "HH:MM", "YYYY-MM-DD", "DD/MM/YYYY"
                ]
                text_lower = text_content.lower()
                if any(pattern in text_lower for pattern in timestamp_patterns):
                    info["has_timestamps"] = True
                    info["indexing_type"] = "time"
                
                # Check for event labels
                event_patterns = [
                    "stuck pipe", "lost circulation", "kick", "npt",
                    "non-productive", "event", "incident"
                ]
                if any(pattern in text_lower for pattern in event_patterns):
                    info["has_event_labels"] = True
                
                # Check for parameters
                param_patterns = {
                    "spp": ["spp", "standpipe pressure", "pump pressure"],
                    "wob": ["wob", "weight on bit"],
                    "rpm": ["rpm", "revolution"],
                    "torque": ["torque", "torq"],
                    "rop": ["rop", "rate of penetration"],
                    "flow": ["flow", "flow-in", "flow-out"],
                    "pit_volume": ["pit volume", "pit vol"],
                    "depth": ["depth", "md", "tvd"],
                    "mud_weight": ["mud weight", "mw", "ppg"],
                    "gas": ["gas", "total gas", "c1", "c2"]
                }
                
                for param, patterns in param_patterns.items():
                    if any(pattern in text_lower for pattern in patterns):
                        info["parameters_found"].append(param)
                
                # Determine indexing type
                if "depth" in info["parameters_found"] and not info["has_timestamps"]:
                    info["indexing_type"] = "depth"
                elif info["has_timestamps"]:
                    info["indexing_type"] = "time"
        
        except Exception as e:
            info["issues"] = [f"Error reading PDF: {str(e)}"]
        
        return info
    
    def _assess_doc(self, file_path: Path) -> Dict:
        """Assess DOC/DOCX file structure."""
        info = {
            "parameters_found": [],
            "has_timestamps": False,
            "has_event_labels": False,
            "indexing_type": "unknown",
            "well_id": None
        }
        
        if not HAS_DOCX:
            info["issues"] = ["python-docx not available"]
            return info
        
        try:
            doc = Document(file_path)
            text_content = "\n".join([para.text for para in doc.paragraphs])
            text_lower = text_content.lower()
            
            # Similar checks as PDF
            well_patterns = ["WELL NAME:", "WELL:", "Well Name:", "Well:"]
            for pattern in well_patterns:
                if pattern in text_content:
                    idx = text_content.find(pattern)
                    line = text_content[idx:idx+100]
                    parts = line.split(":")
                    if len(parts) > 1:
                        info["well_id"] = parts[1].strip()[:50]
                    break
            
            # Check for timestamps
            timestamp_patterns = ["timestamp", "time", "date", "hour"]
            if any(pattern in text_lower for pattern in timestamp_patterns):
                info["has_timestamps"] = True
                info["indexing_type"] = "time"
            
            # Check for event labels
            event_patterns = ["stuck pipe", "lost circulation", "kick", "npt"]
            if any(pattern in text_lower for pattern in event_patterns):
                info["has_event_labels"] = True
            
            # Check for parameters (simplified)
            if "spp" in text_lower or "standpipe" in text_lower:
                info["parameters_found"].append("spp")
            if "wob" in text_lower or "weight on bit" in text_lower:
                info["parameters_found"].append("wob")
            if "depth" in text_lower or "md" in text_lower:
                info["parameters_found"].append("depth")
        
        except Exception as e:
            info["issues"] = [f"Error reading DOC: {str(e)}"]
        
        return info
    
    def _assess_csv(self, file_path: Path) -> Dict:
        """Assess CSV file structure."""
        info = {
            "parameters_found": [],
            "has_timestamps": False,
            "has_event_labels": False,
            "indexing_type": "unknown",
            "well_id": None
        }
        
        try:
            import pandas as pd
            df = pd.read_csv(file_path, nrows=100)  # Read first 100 rows
            
            columns_lower = [col.lower() for col in df.columns]
            
            # Check for timestamps
            timestamp_cols = [col for col in columns_lower if any(
                term in col for term in ["time", "timestamp", "date"]
            )]
            if timestamp_cols:
                info["has_timestamps"] = True
                info["indexing_type"] = "time"
            
            # Check for depth
            depth_cols = [col for col in columns_lower if "depth" in col or col in ["md", "tvd"]]
            if depth_cols:
                info["parameters_found"].append("depth")
                if not info["has_timestamps"]:
                    info["indexing_type"] = "depth"
            
            # Check for common parameters
            param_mapping = {
                "spp": ["spp", "standpipe", "pump pressure"],
                "wob": ["wob", "weight on bit"],
                "rpm": ["rpm"],
                "torque": ["torque", "torq"],
                "rop": ["rop", "rate of penetration"],
                "flow": ["flow"],
                "pit": ["pit"]
            }
            
            for param, patterns in param_mapping.items():
                if any(any(p in col for col in columns_lower) for p in patterns):
                    info["parameters_found"].append(param)
            
            # Estimate well ID from filename or data
            if "well" in columns_lower:
                well_col = [col for col in df.columns if "well" in col.lower()][0]
                if not df[well_col].isna().all():
                    info["well_id"] = str(df[well_col].iloc[0])
        
        except Exception as e:
            info["issues"] = [f"Error reading CSV: {str(e)}"]
        
        return info
    
    def _generate_summary(self):
        """Generate summary statistics."""
        summary = self.results["summary"]
        
        # Collect well IDs
        wells = set()
        for file_info in self.results["files_analyzed"]:
            if file_info.get("well_id"):
                wells.add(file_info["well_id"])
        summary["wells_identified"] = list(wells)
        
        # Check for time-indexed data
        summary["has_time_indexed"] = any(
            file_info.get("indexing_type") == "time"
            for file_info in self.results["files_analyzed"]
        )
        
        # Check for event labels
        summary["has_event_labels"] = any(
            file_info.get("has_event_labels", False)
            for file_info in self.results["files_analyzed"]
        )
        
        # Parameter coverage
        all_params = set()
        for file_info in self.results["files_analyzed"]:
            all_params.update(file_info.get("parameters_found", []))
        summary["parameter_coverage"] = {param: True for param in all_params}
        
        # Identify critical gaps
        gaps = []
        if not summary["has_time_indexed"]:
            gaps.append("No time-indexed sensor data found")
        if not summary["has_event_labels"]:
            gaps.append("No event labels found")
        if len(summary["wells_identified"]) < 5:
            gaps.append(f"Insufficient well count: {len(summary['wells_identified'])} (need 5-10 minimum)")
        
        summary["critical_gaps"] = gaps


def main():
    """Main entry point."""
    data_dir = project_root / "raw_data"
    
    if not data_dir.exists():
        print(f"Error: Data directory not found: {data_dir}")
        sys.exit(1)
    
    print(f"Assessing data quality in: {data_dir}")
    print("-" * 60)
    
    assessor = DataQualityAssessor(data_dir)
    results = assessor.assess_all_files()
    
    # Print summary
    print("\n=== ASSESSMENT SUMMARY ===")
    print(f"Total files analyzed: {results['summary']['total_files']}")
    print(f"Wells identified: {len(results['summary']['wells_identified'])}")
    for well in results['summary']['wells_identified']:
        print(f"  - {well}")
    
    print(f"\nTime-indexed data: {'✅ YES' if results['summary']['has_time_indexed'] else '❌ NO'}")
    print(f"Event labels: {'✅ YES' if results['summary']['has_event_labels'] else '❌ NO'}")
    
    print(f"\nParameters found: {', '.join(results['summary']['parameter_coverage'].keys())}")
    
    print(f"\nCritical Gaps:")
    for gap in results['summary']['critical_gaps']:
        print(f"  ❌ {gap}")
    
    # Print file details
    print("\n=== FILE DETAILS ===")
    for file_info in results['files_analyzed']:
        print(f"\n{file_info['filename']}")
        print(f"  Type: {file_info['file_type']}")
        print(f"  Size: {file_info['file_size_mb']:.2f} MB")
        if file_info.get('well_id'):
            print(f"  Well ID: {file_info['well_id']}")
        print(f"  Indexing: {file_info.get('indexing_type', 'unknown')}")
        print(f"  Parameters: {', '.join(file_info.get('parameters_found', []))}")
        if file_info.get('issues'):
            print(f"  Issues: {', '.join(file_info['issues'])}")
    
    # Save results
    output_file = project_root / "docs" / "data_assessment_results.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n\nResults saved to: {output_file}")


if __name__ == "__main__":
    main()
