package com.matchme.repository;

import com.matchme.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;


public interface EventRepository extends JpaRepository<Event, Long> {

}
