package timefold.ui.backend.helpers;

import java.lang.reflect.Field;
import java.util.Collection;


public record AnnotatedCollectionResult(String fieldName, String fieldType, Field field, Collection<?> collection) {
}