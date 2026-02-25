use yeti_core::prelude::*;

/// Author: public read-only (GraphQL query demo)
/// Seed data provides rich query examples; mutations require auth.
resource!(TableExtender for Author {
    get => allow_read(),
});

/// Publisher: public read-only
resource!(TableExtender for Publisher {
    get => allow_read(),
});

/// Book: public read-only
resource!(TableExtender for Book {
    get => allow_read(),
});

/// Review: public read-only
resource!(TableExtender for Review {
    get => allow_read(),
});

/// Category: public read-only
resource!(TableExtender for Category {
    get => allow_read(),
});
