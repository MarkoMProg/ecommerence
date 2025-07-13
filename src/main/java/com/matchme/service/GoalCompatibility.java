package com.matchme.service;

import com.matchme.model.CommitmentLevel;
import com.matchme.model.PrimaryMotivation;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GoalCompatibility {

    public static int getCommitmentCompatibility(CommitmentLevel level1, CommitmentLevel level2) {
        int[][] matrix = {
            // Casual  Moderate  Intense
            {   3,      2,       1    }, // Casual
            {   2,      3,       2    }, // Moderate  
            {   1,      2,       3    }  // Intense
        };
        return matrix[level1.ordinal()][level2.ordinal()];
    }

    public static int getMotivationCompatibility(PrimaryMotivation mot1, PrimaryMotivation mot2) {
        int[][] matrix = {
            // Learn  Achieve  Social  Career  Innovation
            {   3,     2,      3,      2,      3     }, // Learning
            {   2,     3,      1,      3,      2     }, // Achievement
            {   3,     1,      3,      2,      2     }, // Social
            {   2,     3,      2,      3,      2     }, // Career
            {   3,     2,      2,      2,      3     }  // Innovation
        };
        return matrix[mot1.ordinal()][mot2.ordinal()];
    }

    public static Map<String, List<String>> getRoleSkillMap() {
        Map<String, List<String>> roleSkills = new HashMap<>();
        
        roleSkills.put("Frontend Developer", Arrays.asList(
            "HTML", "CSS", "JavaScript", "React", "Vue", "Angular", 
            "Bootstrap", "Tailwind CSS", "Responsive design", "Git"
        ));
        
        roleSkills.put("Backend Developer", Arrays.asList(
            "Python", "Java", "Node.js", "Express", "Flask", "Django",
            "REST API", "SQL", "MongoDB", "Firebase", "Git", "JSON"
        ));
        
        roleSkills.put("Fullstack Developer", Arrays.asList(
            "JavaScript", "Python", "React", "Node.js", "HTML", "CSS",
            "SQL", "MongoDB", "Git", "API integration", "Database design"
        ));
        
        roleSkills.put("UI/UX Designer", Arrays.asList(
            "Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping",
            "User research", "Design thinking", "Color theory", "Typography",
            "Accessibility", "Canva"
        ));
        
        roleSkills.put("Product Manager", Arrays.asList(
            "Project planning", "Agile", "Scrum", "User stories", 
            "Market research", "Communication", "Time management", 
            "Documentation", "Notion", "Trello", "Problem solving"
        ));
        
        roleSkills.put("Data Analyst", Arrays.asList(
            "Python", "R", "SQL", "Excel", "Data visualization", 
            "Pandas", "NumPy", "Matplotlib", "Tableau", "Power BI",
            "Statistics", "Data cleaning", "Jupyter Notebooks"
        ));
        
        roleSkills.put("Pitcher/Presenter", Arrays.asList(
            "Public speaking", "Presentation design", "Storytelling", 
            "PowerPoint", "Canva", "Market research", "Communication",
            "Demo preparation", "Q&A handling", "Business model basics"
        ));
        
        return roleSkills;
    }
}
