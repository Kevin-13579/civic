package com.devopstitans.civic.repository;

import com.devopstitans.civic.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    // Filter by department and locality (e.g. "Roads" and "Eachanari")
    List<Complaint> findByDepartmentIgnoreCaseAndLocationContainingIgnoreCase(String department, String location);

    // Filter by department only (e.g. all "Roads" complaints across all localities)
    List<Complaint> findByDepartmentIgnoreCase(String department);

    // Filter by location only (e.g. all complaints in "Eachanari" or "Gandhipuram")
    List<Complaint> findByLocationContainingIgnoreCase(String location);
}