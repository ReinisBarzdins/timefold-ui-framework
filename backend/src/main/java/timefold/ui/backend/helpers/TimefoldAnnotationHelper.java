package timefold.ui.backend.helpers;

import org.springframework.stereotype.Component;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Component
public class TimefoldAnnotationHelper {

    public List<AnnotatedCollectionResult> findAnnotatedCollections(
            Object source,
            Class<? extends Annotation> annotationClass
    ) {
        List<AnnotatedCollectionResult> result = new ArrayList<>();

        if (source == null) {
            return result;
        }

        Class<?> clazz = source.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            if (!field.isAnnotationPresent(annotationClass)) {
                continue;
            }

            try {
                field.setAccessible(true);
                Object value = field.get(source);

                if (value instanceof Collection<?> collection) {
                    result.add(new AnnotatedCollectionResult(
                            field.getName(),
                            field.getType().getSimpleName(),
                            field,
                            collection
                    ));
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Failed to access field: " + field.getName(), e);
            }
        }

        return result;
    }


}